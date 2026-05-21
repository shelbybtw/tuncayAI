import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

// Components & Services & Types
import Header from './src/components/Header';
import ChatBubble from './src/components/ChatBubble';
import SettingsModal from './src/components/SettingsModal';
import ChatHistoryDrawer from './src/components/ChatHistoryDrawer';
import { Message, ChatSession, ModelType, MODELS } from './src/types';
import { sendMessageToTuncayAI } from './src/services/api';

const STORAGE_KEY = '@tuncay_chat_sessions_v1';

const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful, professional, and intelligent AI assistant powered by Tuncay AI. Answer in the language the user speaks (prioritize Azerbaijani if user addresses in Azerbaijani). Be clear, structured, and informative.';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64: string } | null>(null);
  
  // UI Visibilities
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // 1. Load sessions from AsyncStorage on Mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
      // If empty or no storage, initialize a default session
      initDefaultSession();
    } catch (error) {
      console.error('Failed to load sessions:', error);
      initDefaultSession();
    }
  };

  const initDefaultSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'Yeni Söhbət',
      messages: [],
      model: 'deepseek/deepseek-chat',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      createdAt: Date.now(),
    };
    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
    saveSessions([newSession]);
  };

  const saveSessions = async (updatedSessions: ChatSession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  };

  // Get active session
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // Image Picking
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İcazə lazımdır', 'Şəkil seçmək üçün qalereya icazəsi verməlisiniz.');
        return;
      }

      const activeModel = MODELS.find(m => m.id === currentSession?.model);
      if (activeModel && !activeModel.supportsVision) {
        Alert.alert(
          'Model Dəyişdirilsin?',
          `${activeModel.name} şəkil analizini dəstəkləmir. Şəkil göndərmək üçün model Gemini 2.5 Flash olaraq dəyişdirilsin?`,
          [
            { text: 'Ləğv et', style: 'cancel' },
            {
              text: 'Dəyişdir',
              onPress: async () => {
                handleUpdateModel('google/gemini-2.5-flash');
                setTimeout(() => launchPicker(), 300);
              }
            }
          ]
        );
      } else {
        await launchPicker();
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const launchPicker = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        base64: asset.base64 || '',
      });
    }
  };

  // 2. Chat Operations
  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if ((!messageContent && !selectedImage) || isLoading || !currentSession) return;

    if (!textToSend) {
      setInputText('');
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Capture the attached image information locally
    const attachedImage = selectedImage;

    // Create User Message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
      imageUri: attachedImage ? attachedImage.uri : undefined,
    };

    // Update session locally
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Auto-update title if it's the first message
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0) {
      updatedTitle = messageContent.length > 26 
        ? messageContent.substring(0, 25) + '...' 
        : (messageContent || 'Şəkilli Mesaj');
    }

    const updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: updatedTitle,
          messages: updatedMessages,
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setIsLoading(true);
    setSelectedImage(null); // Clear selected preview immediately on send

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Call API
      const result = await sendMessageToTuncayAI({
        model: currentSession.model as ModelType,
        messages: updatedMessages,
        systemPrompt: currentSession.systemPrompt,
        attachedImageBase64: attachedImage ? attachedImage.base64 : undefined,
      });

      // Create Assistant Message
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        isImage: result.isImage,
      };

      const finalSessions = updatedSessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, assistantMessage],
          };
        }
        return s;
      });

      setSessions(finalSessions);
      saveSessions(finalSessions);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // If error occurs, restore the image so they don't lose it
      if (attachedImage) {
        setSelectedImage(attachedImage);
      }

      // Add Error Message from System
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ Səhv baş verdi: ${error?.message || 'Şəbəkə xətası. Yenidən cəhd edin.'}`,
        timestamp: Date.now(),
      };

      const finalSessions = updatedSessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, errorMessage],
          };
        }
        return s;
      });

      setSessions(finalSessions);
      saveSessions(finalSessions);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // 3. Settings updates
  const handleUpdateModel = (model: ModelType) => {
    const updated = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, model };
      }
      return s;
    });
    setSessions(updated);
    saveSessions(updated);
  };

  const handleUpdateSystemPrompt = (systemPrompt: string) => {
    const updated = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, systemPrompt };
      }
      return s;
    });
    setSessions(updated);
    saveSessions(updated);
  };

  const handleClearCurrentChat = () => {
    const updated = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [] };
      }
      return s;
    });
    setSessions(updated);
    saveSessions(updated);
  };

  // 4. Session History Operations
  const handleCreateNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: `Söhbət ${sessions.length + 1}`,
      messages: [],
      model: currentSession?.model || 'deepseek/deepseek-chat',
      systemPrompt: currentSession?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      createdAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    saveSessions(updated);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);

    if (currentSessionId === id) {
      setCurrentSessionId(updated[0]?.id || '');
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const activeModelDetails = MODELS.find((m) => m.id === currentSession?.model);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        currentModelName={activeModelDetails?.name || 'Tuncay AI'}
        onMenuPress={() => setIsHistoryVisible(true)}
        onSettingsPress={() => setIsSettingsVisible(true)}
        isConnecting={isLoading}
      />

      {/* Main Chat Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.chatArea}>
          {currentSession && currentSession.messages.length === 0 ? (
            /* Onboarding Welcome Screen */
            <FlatList
              data={[]}
              renderItem={() => null}
              ListEmptyComponent={
                <View style={styles.welcomeContainer}>
                  <View style={styles.welcomeIconContainer}>
                    <LinearGradient
                      colors={['#8b5cf6', '#ec4899']}
                      style={styles.welcomeGradientIcon}
                    >
                      <Ionicons name="sparkles" size={40} color="#ffffff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.welcomeTitle}>Tuncay AI Chat</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Azərbaycan dilini mükəmməl dəstəkləyən ağıllı köməkçiniz. Aşağıdakı təkliflərdən birini seçərək dərhal söhbətə başlaya və ya şəkil göndərərək analiz etdirə bilərsiniz:
                  </Text>

                  {/* Suggestions */}
                  <View style={styles.suggestionsContainer}>
                    {[
                      {
                        title: '✍️ Yaradıcı Yazı',
                        text: 'Yeni texnologiyalar haqqında qısa və maraqlı bir hekayə yaz.',
                      },
                      {
                        title: '💻 Proqramlaşdırma',
                        text: 'React Native layihələrində animasiyaları və renderləri necə sürətləndirə bilərəm?',
                      },
                      {
                        title: '📸 Şəkil Analizi (Multimodal)',
                        text: 'Tuncay AI Vision (Gemini 2.5) modelini seçin, sol tərəfdəki şəkil düyməsinə klikləyib şəkil yükləyin və sualınızı verin.',
                      },
                    ].map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSend(item.text)}
                        style={styles.suggestionCard}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.suggestionTitle}>{item.title}</Text>
                        <Text style={styles.suggestionText}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          ) : (
            /* Message List */
            <FlatList
              ref={flatListRef}
              data={currentSession?.messages || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <ChatBubble
                  message={item}
                  isLast={index === (currentSession?.messages.length || 0) - 1}
                />
              )}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Reasoning / Thinking Indicator */}
          {isLoading && (
            <View style={styles.thinkingContainer}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.thinkingText}>
                {`${activeModelDetails?.name || 'Süni İntellekt'} cavab hazırlayır...`}
              </Text>
            </View>
          )}

          {/* Input Panel */}
          <SafeAreaView style={styles.inputAreaWrapper}>
            {/* Selected Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    onPress={() => setSelectedImage(null)}
                    style={styles.removeImageButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputBar}>
              {/* Image Picker Button */}
              <TouchableOpacity
                onPress={pickImage}
                disabled={isLoading}
                style={styles.imagePickerButton}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={24} color="#8b5cf6" />
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { maxHeight: 100 }]}
                placeholder="Mesajınızı bura yazın..."
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={setInputText}
                multiline
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={(!inputText.trim() && !selectedImage) || isLoading}
                style={[
                  styles.sendButton,
                  ((!inputText.trim() && !selectedImage) || isLoading) && styles.sendButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    (!inputText.trim() && !selectedImage) || isLoading
                      ? ['#1f2430', '#1f2430']
                      : ['#8b5cf6', '#ec4899']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="paper-plane" size={16} color="#ffffff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>

      {/* Settings Modal */}
      {currentSession && (
        <SettingsModal
          visible={isSettingsVisible}
          onClose={() => setIsSettingsVisible(false)}
          selectedModel={currentSession.model as ModelType}
          onSelectModel={handleUpdateModel}
          systemPrompt={currentSession.systemPrompt}
          onSaveSystemPrompt={handleUpdateSystemPrompt}
          onClearChat={handleClearCurrentChat}
        />
      )}

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        visible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onCreateNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d10',
  },
  keyboardContainer: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messageListContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  // Onboarding
  welcomeContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  welcomeGradientIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionCard: {
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  // Thinking Indicator
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#13111c',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e1e4a',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  thinkingText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Input Panel
  inputAreaWrapper: {
    backgroundColor: '#0b0d10',
    borderTopWidth: 1,
    borderTopColor: '#161922',
  },
  imagePreviewContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
  },
  imagePreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232936',
  },
  imagePreview: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0b0d10',
    borderRadius: 10,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imagePickerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
