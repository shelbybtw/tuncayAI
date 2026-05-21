import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ChatSession } from '../types';

interface ChatHistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

export default function ChatHistoryDrawer({
  visible,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
}: ChatHistoryDrawerProps) {
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out (handled before closing visibility in parent, but this is a fallback)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectSession(id);
    handleClose();
  };

  const handleNewSession = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreateNewSession();
    handleClose();
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDeleteSession(id);
  };

  const renderSessionItem = ({ item }: { item: ChatSession }) => {
    const isActive = item.id === currentSessionId;
    const dateStr = new Date(item.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={[styles.sessionItemContainer, isActive && styles.sessionItemActive]}>
        <TouchableOpacity
          onPress={() => handleSelect(item.id)}
          style={styles.sessionItemButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isActive ? 'chatbubble-ellipses' : 'chatbubble-outline'}
            size={18}
            color={isActive ? '#8b5cf6' : '#94a3b8'}
            style={styles.chatIcon}
          />
          <View style={styles.sessionItemMeta}>
            <Text style={[styles.sessionTitle, isActive && styles.sessionTitleActive]} numberOfLines={1}>
              {item.title || 'New Conversation'}
            </Text>
            <Text style={styles.sessionDate}>{dateStr}</Text>
          </View>
        </TouchableOpacity>

        {sessions.length > 1 && (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop overlay */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Menu Panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="time-outline" size={20} color="#8b5cf6" />
              <Text style={styles.headerTitle}>History</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <TouchableOpacity
            onPress={handleNewSession}
            style={styles.newChatButton}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.newChatButtonText}>New Conversation</Text>
          </TouchableOpacity>

          {/* Sessions List */}
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No conversations yet.</Text>
              </View>
            }
          />
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Tuncay AI Client v1.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawerPanel: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#0b0d10',
    borderRightWidth: 1,
    borderRightColor: '#161922',
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161922',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  newChatButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
  },
  sessionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161922',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#232936',
  },
  sessionItemActive: {
    borderColor: '#8b5cf6',
    backgroundColor: '#151323',
  },
  sessionItemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    marginRight: 10,
  },
  sessionItemMeta: {
    flex: 1,
  },
  sessionTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionTitleActive: {
    color: '#ffffff',
  },
  sessionDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#161922',
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 11,
  },
});
