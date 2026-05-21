import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface HeaderProps {
  currentModelName: string;
  onMenuPress: () => void;
  onSettingsPress: () => void;
  isConnecting?: boolean;
}

export default function Header({
  currentModelName,
  onMenuPress,
  onSettingsPress,
  isConnecting = false,
}: HeaderProps) {
  
  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMenuPress();
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSettingsPress();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleMenuPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Tuncay</Text>
            <Text style={styles.titleAccent}>AI</Text>
          </View>
          <View style={styles.modelBadge}>
            <View style={[styles.statusDot, isConnecting ? styles.statusConnecting : styles.statusOnline]} />
            <Text style={styles.modelText}>{currentModelName}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color="#f8fafc" />
        </TouchableOpacity>
      </View>
      <LinearGradient
        colors={['#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomDivider}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0b0d10',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0b0d10',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#232936',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  titleAccent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232936',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: '#10b981', // green
  },
  statusConnecting: {
    backgroundColor: '#f59e0b', // amber
  },
  modelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  bottomDivider: {
    height: 1,
    width: '100%',
    opacity: 0.4,
  },
});
