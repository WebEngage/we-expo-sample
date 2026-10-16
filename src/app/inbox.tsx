import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { InboxMessage } from '@/types';
import { timeAgo } from '@/utils/format';

export default function Inbox() {
  const router = useRouter();
  const { inbox, unreadCount, markRead, markAllRead } = useApp();

  const open = (m: InboxMessage) => {
    markRead(m.id);
    if (m.link) router.push(m.link as never);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={markAllRead} hitSlop={8} testID="inbox-mark-all-read">
                <Text style={styles.markAll}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      {inbox.length === 0 ? (
        <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.count} testID="inbox-unread-count">
            {unreadCount} unread
          </Text>
          {inbox.map((m) => (
            <Pressable key={m.id} style={[card, styles.item, !m.read && styles.unread]} onPress={() => open(m)} testID={`inbox-item-${m.id}`}>
              {!m.read && <View style={styles.dot} />}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.title, !m.read && { fontWeight: '800' }]}>{m.title}</Text>
                <Text style={styles.body}>{m.body}</Text>
                <Text style={styles.time}>{timeAgo(m.createdAt)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  count: { color: colors.muted, fontSize: 13 },
  markAll: { color: colors.primary, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  unread: { backgroundColor: colors.primarySoft, borderColor: '#BFDDFB' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { color: colors.muted, fontSize: 13 },
  time: { color: colors.muted, fontSize: 11 },
});
