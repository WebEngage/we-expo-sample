import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CustomDataEditor, resolveCustomData } from '@/components/CustomDataEditor';
import { Button, Field } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { CustomAttr } from '@/types';
import { isEmail } from '@/utils/format';

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [customData, setCustomData] = useState<CustomAttr[]>([]);

  const onLogin = () => {
    if (!isEmail(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    const extra = resolveCustomData(customData);
    if (!extra) return;
    const res = login(email, password, extra);
    if (!res.ok) setError(res.message ?? 'Could not log in.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError('');
          }}
          testID="login-email"
        />
        <Field
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError('');
          }}
          testID="login-password"
        />
        {!!error && <Text style={styles.error}>{error}</Text>}

        <CustomDataEditor rows={customData} onChange={setCustomData} testIDPrefix="login-custom" />

        <Button title="Log in" onPress={onLogin} testID="login-submit" />

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Demo account</Text>
          <Text style={styles.hint}>demo@weshop.com / demo1234</Text>
          <Button
            title="Fill demo credentials"
            variant="ghost"
            onPress={() => {
              setEmail('demo@weshop.com');
              setPassword('demo1234');
              setError('');
            }}
            testID="login-fill-demo"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  error: { color: colors.danger, fontSize: 13 },
  hintBox: { alignItems: 'center', gap: 2, marginTop: 8 },
  hintTitle: { fontWeight: '700', color: colors.text },
  hint: { color: colors.muted },
});
