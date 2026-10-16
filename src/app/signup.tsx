import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { CustomDataEditor, resolveCustomData } from '@/components/CustomDataEditor';
import { Button, Field } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { CustomAttr } from '@/types';
import { isEmail } from '@/utils/format';

export default function Signup() {
  const { signup } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [customData, setCustomData] = useState<CustomAttr[]>([]);

  const onSignup = () => {
    if (!firstName.trim()) return setError('First name is required.');
    if (!isEmail(email)) return setError('Enter a valid email address.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit phone number.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    const extra = resolveCustomData(customData);
    if (!extra) return;
    const res = signup({ firstName, lastName, email, phone, password }, extra);
    if (!res.ok) setError(res.message ?? 'Could not create the account.');
  };

  const clear = () => setError('');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="First name" autoCapitalize="words" value={firstName} onChangeText={(t) => { setFirstName(t); clear(); }} testID="signup-first-name" />
        <Field label="Last name" autoCapitalize="words" value={lastName} onChangeText={setLastName} testID="signup-last-name" />
        <Field label="Email" keyboardType="email-address" placeholder="you@example.com" value={email} onChangeText={(t) => { setEmail(t); clear(); }} testID="signup-email" />
        <Field label="Phone" keyboardType="phone-pad" placeholder="9876543210" value={phone} onChangeText={(t) => { setPhone(t); clear(); }} testID="signup-phone" />
        <Field label="Password" secureTextEntry value={password} onChangeText={(t) => { setPassword(t); clear(); }} testID="signup-password" />
        {!!error && <Text style={styles.error}>{error}</Text>}

        <CustomDataEditor rows={customData} onChange={setCustomData} testIDPrefix="signup-custom" />

        <Button title="Create account" onPress={onSignup} testID="signup-submit" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  error: { color: colors.danger, fontSize: 13 },
});
