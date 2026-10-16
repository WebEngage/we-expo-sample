import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CustomDataEditor, resolveCustomData } from '@/components/CustomDataEditor';
import { Button, Chip, Field } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { CustomAttr, User } from '@/types';
import { isEmail } from '@/utils/format';

const GENDERS: User['gender'][] = ['Male', 'Female', 'Other'];

export default function ProfileEdit() {
  const router = useRouter();
  const { user, updateProfile, showToast } = useApp();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [gender, setGender] = useState<User['gender']>(user?.gender ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [customData, setCustomData] = useState<CustomAttr[]>([]);
  const [error, setError] = useState('');

  const onSave = () => {
    if (!firstName.trim()) return setError('First name is required.');
    if (!isEmail(email)) return setError('Enter a valid email address.');
    if (birthDate && Number.isNaN(new Date(birthDate).getTime())) return setError('Birth date must be YYYY-MM-DD.');
    const extra = resolveCustomData(customData);
    if (!extra) return;
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), gender, birthDate, city: city.trim() }, extra);
    showToast('Profile updated');
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="First name" autoCapitalize="words" value={firstName} onChangeText={setFirstName} testID="profile-first-name" />
        <Field label="Last name" autoCapitalize="words" value={lastName} onChangeText={setLastName} testID="profile-last-name" />
        <Field label="Email" keyboardType="email-address" value={email} onChangeText={setEmail} testID="profile-email" />
        <Field label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} testID="profile-phone" />

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <Chip key={g} label={g} active={gender === g} onPress={() => setGender(gender === g ? '' : g)} testID={`profile-gender-${g}`} />
            ))}
          </View>
        </View>

        <Field label="Birth date" placeholder="YYYY-MM-DD" value={birthDate} onChangeText={setBirthDate} testID="profile-birth-date" />
        <Field label="City" autoCapitalize="words" value={city} onChangeText={setCity} testID="profile-city" />

        <CustomDataEditor title="Add custom attributes" rows={customData} onChange={setCustomData} testIDPrefix="profile-custom" />

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button title="Save changes" onPress={onSave} testID="profile-save" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', gap: 8 },
  error: { color: colors.danger },
});
