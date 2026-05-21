import { Message, ModelType } from '../types';

const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface SendMessageOptions {
  model: ModelType;
  messages: Message[];
  systemPrompt?: string;
  attachedImageBase64?: string; // The base64 data for the image being sent right now
}

export async function sendMessageToTuncayAI({
  model,
  messages,
  systemPrompt,
  attachedImageBase64,
}: SendMessageOptions): Promise<{ content: string; isImage?: boolean }> {
  try {
    const apiMessages: any[] = [];

    // Add system prompt if provided
    if (systemPrompt && systemPrompt.trim()) {
      apiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add chat history (except the last message which we might format as multimodal)
    const historyMessages = messages.slice(0, -1);
    historyMessages.forEach((msg) => {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add the current message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      if (attachedImageBase64 && (model === 'google/gemini-2.5-flash' || model === 'openai/gpt-4o-mini')) {
        apiMessages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: lastMsg.content || 'Bu şəkildə nə var?',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${attachedImageBase64}`,
              },
            },
          ],
        });
      } else {
        apiMessages.push({
          role: 'user',
          content: lastMsg.content,
        });
      }
    }

    const body = {
      model,
      messages: apiMessages,
      max_tokens: 2048, // Prevent credit calculation issues on low-balance accounts
    };

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://expo.dev',
        'X-Title': 'Tuncay AI Chat Client',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `API error (${response.status})`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response choices returned from OpenRouter.');
    }

    const choice = data.choices[0];
    const assistantMessage = choice.message;
    const content = assistantMessage.content || '';

    return {
      content,
      isImage: false,
    };
  } catch (error: any) {
    console.error('Error in sendMessageToTuncayAI:', error);
    throw error;
  }
}
