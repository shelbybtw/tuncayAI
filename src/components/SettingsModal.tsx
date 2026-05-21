import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ModelType, MODELS } from '../types';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedModel: ModelType;
  onSelectModel: (model: ModelType) => void;
  systemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
  onClearChat: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export default function SettingsModal({
  visible,
  onClose,
  selectedModel,
  onSelectModel,
  systemPrompt,
  onSaveSystemPrompt,
  onClearChat,
  apiKey,
  onSaveApiKey,
}: SettingsModalProps) {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaveSystemPrompt(localPrompt);
    onSaveApiKey(localApiKey.trim());
    onClose();
  };

  const handleModelSelect = (modelId: ModelType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectModel(modelId);
  };

  const handleClearChatPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to delete all messages in this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClearChat();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Configuration</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Model Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hardware-chip-outline" size={18} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Model Selection</Text>
              </View>
              
              {MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <TouchableOpacity
                    key={model.id}
                    onPress={() => handleModelSelect(model.id)}
                    style={[styles.card, isSelected && styles.activeCard]}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, isSelected && styles.activeCardTitle]}>
                        {model.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#8b5cf6" />
                      )}
                    </View>
                    <Text style={styles.cardDesc}>{model.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* System Prompt Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={18} color="#ec4899" />
                <Text style={styles.sectionTitle}>System Prompt</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Define the behavior, tone, and character of the assistant.
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={3}
                value={localPrompt}
                onChangeText={setLocalPrompt}
                placeholder="E.g., You are a helpful and intelligent AI assistant."
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.sectionTitle}>Utilities</Text>
              </View>

              <TouchableOpacity
                onPress={handleClearChatPress}
                style={styles.dangerButton}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={styles.dangerButtonText}>Clear Conversation History</Text>
              </TouchableOpacity>
            </View>

            {/* API Key Box */}
            <View style={styles.apiKeySection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="key-outline" size={18} color="#f59e0b" />
                <Text style={styles.sectionTitle}>OpenRouter API Açarınız</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Öz şəxsi API açarınızı daxil edin. Bu açar yalnız sizin telefonunuzda saxlanılır.
              </Text>
              <View style={styles.apiKeyBox}>
                <TextInput
                  style={styles.apiKeyInput}
                  value={localApiKey}
                  onChangeText={setLocalApiKey}
                  placeholder="sk-or-v1-..."
                  placeholderTextColor="#64748b"
                  secureTextEntry
                />
              </View>
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Bottom Save Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.saveButtonContainer}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0b0d10',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#161922',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161922',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#232936',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  activeCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#151323',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  activeCardTitle: {
    color: '#ffffff',
  },
  cardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  textInput: {
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    height: 90,
    textAlignVertical: 'top',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  apiKeySection: {
    marginBottom: 16,
  },
  apiKeyBox: {
    backgroundColor: '#0f1115',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
  },
  apiKeyInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    color: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 10,
    backgroundColor: '#0b0d10',
    borderTopWidth: 1,
    borderTopColor: '#161922',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
