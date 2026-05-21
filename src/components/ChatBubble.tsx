import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isLast: boolean;
}

const { width } = Dimensions.get('window');

export default function ChatBubble({ message, isLast }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  
  // Animation for bubble entry
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  // Animation for reasoning expand/collapse
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: reasoningExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false, // height/layout animation cannot use native driver
    }).start();
  }, [reasoningExpanded]);

  const copyToClipboard = async (text: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReasoning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReasoningExpanded(!reasoningExpanded);
  };

  // Helper to parse formatting (bold, italic, code, bullets)
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if it's a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let language = 'code';
        let codeContent = lines.join('\n');

        // Check if first line is language
        if (lines.length > 0 && lines[0].length < 15 && !lines[0].includes(' ') && lines[0] !== '') {
          language = lines[0];
          codeContent = lines.slice(1).join('\n');
        }

        return (
          <View key={`code-${index}`} style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeLanguage}>{language.toUpperCase()}</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(codeContent)}
                style={styles.codeCopyButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
                  size={14}
                  color={copied ? '#10b981' : '#94a3b8'}
                />
                <Text style={[styles.codeCopyText, copied && { color: '#10b981' }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.codeBody}>
              <Text style={styles.codeText} selectable={true}>
                {codeContent}
              </Text>
            </View>
          </View>
        );
      }

      // Inline parsing for bold (**), italic (*), code (`), bullets (\n-)
      const lines = part.split('\n');
      return (
        <View key={`text-block-${index}`} style={styles.textBlock}>
          {lines.map((line, lIdx) => {
            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
            let cleanLine = line;
            if (isBullet) {
              cleanLine = line.trim().replace(/^[-*]\s+/, '');
            }

            // Parse inline codes, bold and italics
            const tokens = [];
            let currentStr = cleanLine;
            let tokenIdx = 0;

            // Simple parser regex for markdown bold, italic, code
            const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
            const segments = currentStr.split(regex);

            const renderedSegments = segments.map((seg, sIdx) => {
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return (
                  <Text key={sIdx} style={styles.boldText}>
                    {seg.slice(2, -2)}
                  </Text>
                );
              }
              if (seg.startsWith('*') && seg.endsWith('*')) {
                return (
                  <Text key={sIdx} style={styles.italicText}>
                    {seg.slice(1, -1)}
                  </Text>
                );
              }
              if (seg.startsWith('`') && seg.endsWith('`')) {
                return (
                  <View key={sIdx} style={styles.inlineCodeContainer}>
                    <Text style={styles.inlineCodeText}>{seg.slice(1, -1)}</Text>
                  </View>
                );
              }
              return <Text key={sIdx}>{seg}</Text>;
            });

            return (
              <View
                key={`line-${lIdx}`}
                style={[
                  styles.lineWrapper,
                  isBullet && styles.bulletWrapper,
                  lIdx > 0 && { marginTop: 4 },
                ]}
              >
                {isBullet && <Text style={styles.bulletDot}>•</Text>}
                <Text
                  style={[
                    styles.normalText,
                    isUser ? styles.userText : styles.assistantText,
                  ]}
                  selectable={true}
                >
                  {renderedSegments}
                </Text>
              </View>
            );
          })}
        </View>
      );
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Sender Avatar / Icon */}
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#a855f7" />
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        {/* Reasoning section (collapsible brain icon for assistant) */}
        {!isUser && message.reasoning && (
          <View style={styles.reasoningWrapper}>
            <TouchableOpacity
              onPress={toggleReasoning}
              activeOpacity={0.8}
              style={[
                styles.reasoningHeader,
                reasoningExpanded && styles.reasoningHeaderActive,
              ]}
            >
              <View style={styles.reasoningTitleWrapper}>
                <Ionicons name="logo-electron" size={14} color="#8b5cf6" style={styles.brainIcon} />
                <Text style={styles.reasoningTitle}>Thinking Process</Text>
              </View>
              <Ionicons
                name={reasoningExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#8b5cf6"
              />
            </TouchableOpacity>
            
            {reasoningExpanded && (
              <View style={styles.reasoningContent}>
                <Text style={styles.reasoningText} selectable={true}>
                  {message.reasoning}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Main Content */}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            message.isImage && styles.imageBubble,
            message.imageUri && styles.userAttachedImageBubble,
          ]}
        >
          {message.imageUri && (
            <View style={styles.userAttachedImageWrapper}>
              <Image
                source={{ uri: message.imageUri }}
                style={styles.userAttachedImage}
                resizeMode="cover"
              />
            </View>
          )}

          {message.isImage ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: message.content }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          ) : (
            message.content ? renderFormattedText(message.content) : null
          )}
        </View>

        {/* Copy Button & Metadata below the bubble */}
        <View style={[styles.metaContainer, isUser ? styles.userMeta : styles.assistantMeta]}>
          <Text style={styles.timeText}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!isUser && (
            <TouchableOpacity
              onPress={() => copyToClipboard(message.content)}
              style={styles.actionIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="copy-outline" size={13} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    width: '100%',
    paddingHorizontal: 12,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#232936',
    borderWidth: 1,
    borderColor: '#384357',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubbleWrapper: {
    maxWidth: width * 0.78,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    borderBottomLeftRadius: 4,
  },
  imageBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
  },
  userAttachedImageBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: '#6366f1',
  },
  userAttachedImageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#0b0d10',
  },
  userAttachedImage: {
    width: width * 0.70,
    height: width * 0.50,
    borderRadius: 16,
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0b0d10',
  },
  image: {
    width: width * 0.70,
    height: width * 0.70,
    borderRadius: 16,
  },
  textBlock: {
    flexDirection: 'column',
  },
  lineWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bulletWrapper: {
    paddingLeft: 4,
  },
  bulletDot: {
    color: '#94a3b8',
    fontSize: 16,
    marginRight: 6,
    lineHeight: 20,
  },
  normalText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#e2e8f0',
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  inlineCodeContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginHorizontal: 2,
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  inlineCodeText: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#ec4899',
  },
  // Fenced Code Block
  codeContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    width: '100%',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  codeLanguage: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  codeCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeCopyText: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 4,
  },
  codeBody: {
    padding: 12,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#38bdf8',
    lineHeight: 18,
  },
  // Reasoning
  reasoningWrapper: {
    backgroundColor: '#13111c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e1e4a',
    marginBottom: 6,
    overflow: 'hidden',
  },
  reasoningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1429',
  },
  reasoningHeaderActive: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#2e1e4a',
  },
  reasoningTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brainIcon: {
    marginRight: 6,
  },
  reasoningTitle: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '600',
  },
  reasoningContent: {
    padding: 12,
    backgroundColor: '#0f0c18',
  },
  reasoningText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#a78bfa',
    fontStyle: 'italic',
  },
  // Meta (time, copy buttons)
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userMeta: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  assistantMeta: {
    justifyContent: 'flex-start',
    marginLeft: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
  },
  actionIconButton: {
    marginLeft: 8,
  },
});
