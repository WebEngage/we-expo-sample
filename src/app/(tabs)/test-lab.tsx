import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import WebEngageManager from '@/analytics/WebEngageManager';
import { INLINE } from '@/analytics/inlinePlacements';
import { CustomDataEditor, newRow, resolveCustomData } from '@/components/CustomDataEditor';
import { Button, Chip, Field, SectionTitle, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { CustomAttr, Payload } from '@/types';

type Mode = 'event' | 'screen' | 'user';

interface LogEntry {
  id: number;
  kind: string;
  name: string;
  data: Payload;
  at: string;
}

const stringify = (data: Payload) => JSON.stringify(data, null, 2);

export default function TestLab() {
  const { showToast } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('event');
  const [log, setLog] = useState<LogEntry[]>([]);

  const [eventName, setEventName] = useState('');
  const [eventData, setEventData] = useState<CustomAttr[]>([newRow()]);

  const [screenName, setScreenName] = useState('');
  const [screenData, setScreenData] = useState<CustomAttr[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userData, setUserData] = useState<CustomAttr[]>([newRow()]);

  const add = (kind: string, name: string, data: Payload) => {
    setLog((l) => [{ id: Date.now(), kind, name, data, at: new Date().toLocaleTimeString() }, ...l].slice(0, 20));
    showToast(`${kind} recorded`);
  };

  const fireEvent = () => {
    if (!eventName.trim()) return showToast('Enter an event name');
    const data = resolveCustomData(eventData);
    if (!data) return;
    WebEngageManager.trackEvent(eventName.trim(), data);
    add('Event', eventName.trim(), data);
  };

  const trackScreen = () => {
    if (!screenName.trim()) return showToast('Enter a screen name');
    const data = resolveCustomData(screenData);
    if (!data) return;
    WebEngageManager.trackScreen(screenName.trim(), data);
    add('Screen', screenName.trim(), data);
  };

  const setUser = () => {
    const data = resolveCustomData(userData);
    if (!data) return;
    const standard: Payload = {};
    if (firstName.trim()) standard.firstName = firstName.trim();
    if (lastName.trim()) standard.lastName = lastName.trim();
    if (email.trim()) standard.email = email.trim();
    if (phone.trim()) standard.phone = phone.trim();
    if (Object.keys(standard).length === 0 && Object.keys(data).length === 0) return showToast('Nothing to set');
    // Test tool: values go to WebEngage exactly as the tester typed them.
    if (standard.firstName) WebEngageManager.setFirstName(String(standard.firstName));
    if (standard.lastName) WebEngageManager.setLastName(String(standard.lastName));
    if (standard.email) WebEngageManager.setEmail(String(standard.email));
    if (standard.phone) WebEngageManager.setPhone(String(standard.phone));
    for (const [name, value] of Object.entries(data)) WebEngageManager.setAttribute(name, value);
    add('User attributes', 'setUser', { ...standard, ...data });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Compose any custom event, screen view or user attribute with typed values. Each entry is recorded in the log below.
      </Text>

      <View style={styles.modes}>
        <Chip label="Custom event" active={mode === 'event'} onPress={() => setMode('event')} testID="lab-mode-event" />
        <Chip label="Custom screen" active={mode === 'screen'} onPress={() => setMode('screen')} testID="lab-mode-screen" />
        <Chip label="User attributes" active={mode === 'user'} onPress={() => setMode('user')} testID="lab-mode-user" />
      </View>

      {mode === 'event' && (
        <View style={styles.form}>
          <Field label="Event name" placeholder="e.g. Coupon Applied" value={eventName} onChangeText={setEventName} testID="lab-event-name" />
          <CustomDataEditor title="Event attributes" rows={eventData} onChange={setEventData} defaultOpen testIDPrefix="lab-event" />
          <Button title="Fire event" icon="flash-outline" onPress={fireEvent} testID="lab-fire-event" />
        </View>
      )}

      {mode === 'screen' && (
        <View style={styles.form}>
          <Field label="Screen name" placeholder="e.g. Offers" value={screenName} onChangeText={setScreenName} testID="lab-screen-name" />
          <CustomDataEditor title="Screen data" rows={screenData} onChange={setScreenData} defaultOpen testIDPrefix="lab-screen" />
          <Button title="Track screen" icon="eye-outline" onPress={trackScreen} testID="lab-track-screen" />
        </View>
      )}

      {mode === 'user' && (
        <View style={styles.form}>
          <Field label="First name" autoCapitalize="words" value={firstName} onChangeText={setFirstName} testID="lab-user-first-name" />
          <Field label="Last name" autoCapitalize="words" value={lastName} onChangeText={setLastName} testID="lab-user-last-name" />
          <Field label="Email" keyboardType="email-address" value={email} onChangeText={setEmail} testID="lab-user-email" />
          <Field label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} testID="lab-user-phone" />
          <CustomDataEditor title="Custom user attributes" rows={userData} onChange={setUserData} defaultOpen testIDPrefix="lab-user" />
          <Button title="Set attributes" icon="person-add-outline" onPress={setUser} testID="lab-set-user" />
        </View>
      )}

      <SectionTitle>In-Line placements</SectionTitle>
      <View style={styles.form}>
        <Text style={styles.intro}>
          Placements defined on the dashboard. The Home banner is on the Home tab; the others each have their own screen.
        </Text>
        <Button
          title={`Home · ${INLINE.home.label} (${INLINE.home.androidPropertyId})`}
          icon="home-outline"
          variant="secondary"
          onPress={() => router.navigate('/' as never)}
          testID="lab-inline-home"
        />
        <Button
          title={`Screen 1 · ${INLINE.screen1.label} (${INLINE.screen1.androidPropertyId})`}
          icon="text-outline"
          variant="secondary"
          onPress={() => router.push('/inline/screen1' as never)}
          testID="lab-inline-screen1"
        />
        <Button
          title={`Screen 3 · ${INLINE.screen3.label} (${INLINE.screen3.androidPropertyId})`}
          icon="albums-outline"
          variant="secondary"
          onPress={() => router.push('/inline/screen3' as never)}
          testID="lab-inline-screen3"
        />
        <Button
          title={`Screen 4 · ${INLINE.screen4.label} (${INLINE.screen4.androidPropertyId})`}
          icon="warning-outline"
          variant="secondary"
          onPress={() => router.push('/inline/screen4' as never)}
          testID="lab-inline-screen4"
        />
      </View>

      <SectionTitle action={log.length ? { label: 'Clear', onPress: () => setLog([]) } : undefined}>Log</SectionTitle>
      {log.length === 0 ? (
        <Text style={styles.empty}>Nothing recorded yet.</Text>
      ) : (
        log.map((e) => (
          <View key={e.id} style={[card, styles.logItem]} testID="lab-log-entry">
            <Text style={styles.logHead}>
              {e.kind} · {e.name}
            </Text>
            <Text style={styles.logTime}>{e.at}</Text>
            <Text style={styles.logBody}>{stringify(e.data)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  intro: { color: colors.muted, fontSize: 13 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  form: { gap: 14 },
  empty: { color: colors.muted },
  logItem: { gap: 4 },
  logHead: { fontWeight: '700', color: colors.text },
  logTime: { fontSize: 11, color: colors.muted },
  logBody: { fontFamily: 'Courier', fontSize: 12, color: colors.text, marginTop: 4 },
});
