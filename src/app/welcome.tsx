import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function Welcome() {
  const router = useRouter();
  const { continueAsGuest } = useApp();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="bag-handle" size={44} color="#fff" />
        </View>
        <Text style={styles.title}>WE Shop</Text>
        <Text style={styles.subtitle}>Footwear, clothing, electronics and more, delivered to your door.</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Log in" onPress={() => router.push('/login')} testID="welcome-login" />
        <Button title="Create account" variant="secondary" onPress={() => router.push('/signup')} testID="welcome-signup" />
        <Button title="Continue as guest" variant="ghost" onPress={() => continueAsGuest()} testID="welcome-guest" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { width: 88, height: 88, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', maxWidth: 280 },
  actions: { gap: 10 },
});
