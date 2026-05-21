export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  timestamp: number;
  isImage?: boolean;     // True if assistant returned an image (legacy/output)
  imageUri?: string;    // Local path of the image attached by the user (input)
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  systemPrompt: string;
  createdAt: number;
}

export type ModelType =
  | 'deepseek/deepseek-chat'
  | 'google/gemini-2.5-flash'
  | 'openai/gpt-4o-mini';

export const MODELS: { 
  id: ModelType; 
  name: string; 
  description: string; 
  supportsVision?: boolean;
}[] = [
  {
    id: 'deepseek/deepseek-chat',
    name: 'Tuncay AI Mətn (DeepSeek V3)',
    description: 'Yazı yazmaq, sualları cavablandırmaq və kod yazmaq üçün sürətli və ağıllı köməkçi.',
    supportsVision: false,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Tuncay AI Vision (Gemini 2.5)',
    description: 'Şəkilləri analiz etmək və sualları cavablandırmaq üçün sürətli, multimodal köməkçi.',
    supportsVision: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'Tuncay AI GPT-4o Mini',
    description: 'OpenAI tərəfindən hazırlanmış çox sürətli, ağıllı və ucuz şəkil analiz/mətn modeli.',
    supportsVision: true,
  },
];
