import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  deleteAll,
  getNotificationList,
  markDelete,
  markRead as weMarkRead,
  markUnread as weMarkUnread,
  readAll,
  trackClick,
  trackView,
  unReadAll,
} from '@/analytics/webengageInbox';
import { EmptyState, card } from '@/components/ui';
import { colors } from '@/constants/theme';
import { timeAgo } from '@/utils/format';

type WEItem = {
  creationTime?: string;
  experimentId?: string;
  childExperimentId?: string;
  variationId?: string;
  status?: 'READ' | 'UNREAD';
  message?: { title?: string; message?: string };
};

// A stable id for a WebEngage message: confirm these fields against the data you get back.
const keyOf = (i: WEItem) => `${i.experimentId ?? ''}|${i.childExperimentId ?? ''}|${i.variationId ?? ''}|${i.creationTime ?? ''}`;

/** Roughly a screenful of messages. */
const FILL_COUNT = 8;

type Row = { k: 'head' } | { k: 'item'; item: WEItem } | { k: 'more' };

/** Every message here comes from WebEngage for the signed-in user; the app keeps no list of its own. */
export default function Inbox() {
  const [items, setItems] = useState<WEItem[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const seen = useRef(new Set<string>());

  // First page: no offset.
  const loadFirst = useCallback(async () => {
    const { messageList, hasNext: more } = await getNotificationList();
    setItems(messageList ?? []);
    setHasNext(!!more);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFirst();
    } finally {
      setRefreshing(false);
    }
  }, [loadFirst]);

  // Next page: the offset is the LAST item of the current list, not a page number.
  const loadMore = useCallback(() => {
    if (loading || !hasNext || items.length === 0) return;
    setLoading(true);
    getNotificationList(items[items.length - 1])
      .then(({ messageList, hasNext: more }) => {
        const page = messageList ?? [];
        setItems((cur) => [...cur, ...page]);
        // The SDK can report hasNext on a short first page; an empty next page is the real end.
        setHasNext(!!more && page.length > 0);
      })
      .finally(() => setLoading(false));
  }, [loading, hasNext, items]);

  // A list shorter than the screen never scrolls, so onEndReached never fires: keep paging until it fills or ends.
  useEffect(() => {
    if (hasNext && !loading && items.length > 0 && items.length < FILL_COUNT) loadMore();
  }, [hasNext, loading, items, loadMore]);

  // View tracking: once per message, when it first becomes visible.
  const onViewable = useRef(({ viewableItems }: { viewableItems: { item: Row }[] }) => {
    viewableItems.forEach(({ item }) => {
      if (item.k !== 'item') return;
      const key = keyOf(item.item);
      if (!seen.current.has(key)) {
        seen.current.add(key);
        trackView(item.item);
      }
    });
  }).current;

  const setStatus = (item: WEItem, status: 'READ' | 'UNREAD') =>
    setItems((cur) => cur.map((i) => (i === item ? { ...i, status } : i)));

  const open = (item: WEItem) => {
    trackClick(item);
    weMarkRead(item);
    setStatus(item, 'READ');
  };

  const unreadCount = items.filter((i) => i.status !== 'READ').length;

  const rows: Row[] = [];
  if (items.length > 0) {
    rows.push({ k: 'head' });
    items.forEach((item) => rows.push({ k: 'item', item }));
    if (hasNext) rows.push({ k: 'more' });
  }

  const renderRow = ({ item: row }: { item: Row }) => {
    switch (row.k) {
      case 'head':
        return (
          <View style={styles.head}>
            <Text style={styles.count} testID="inbox-unread-count">
              {unreadCount} unread
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  readAll(items);
                  setItems((c) => c.map((i) => ({ ...i, status: 'READ' as const })));
                }}
                hitSlop={6}
                testID="inbox-we-read-all">
                <Text style={styles.action}>Read all</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  unReadAll(items);
                  setItems((c) => c.map((i) => ({ ...i, status: 'UNREAD' as const })));
                }}
                hitSlop={6}
                testID="inbox-we-unread-all">
                <Text style={styles.action}>Unread all</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  deleteAll(items);
                  setItems([]);
                  setHasNext(false);
                }}
                hitSlop={6}
                testID="inbox-we-delete-all">
                <Text style={[styles.action, { color: colors.danger }]}>Delete all</Text>
              </Pressable>
            </View>
          </View>
        );
      case 'item': {
        const i = row.item;
        const unread = i.status !== 'READ';
        const created = i.creationTime && !Number.isNaN(new Date(i.creationTime).getTime()) ? timeAgo(i.creationTime) : undefined;
        return (
          <Pressable style={[card, styles.item, unread && styles.unread]} onPress={() => open(i)} testID="inbox-we-item">
            {unread && <View style={styles.dot} />}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.title, unread && { fontWeight: '800' }]}>{i.message?.title ?? i.message?.message}</Text>
              {!!i.message?.title && !!i.message?.message && <Text style={styles.body}>{i.message.message}</Text>}
              {!!created && <Text style={styles.time}>{created}</Text>}
              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    if (unread) {
                      weMarkRead(i);
                      setStatus(i, 'READ');
                    } else {
                      weMarkUnread(i);
                      setStatus(i, 'UNREAD');
                    }
                  }}
                  hitSlop={6}>
                  <Text style={styles.action}>{unread ? 'Mark read' : 'Mark unread'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    markDelete(i);
                    setItems((c) => c.filter((x) => x !== i));
                  }}
                  hitSlop={6}>
                  <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      }
      case 'more':
        return <Text style={styles.count}>{loading ? 'Loading…' : 'Scroll for more'}</Text>;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable
                onPress={() => {
                  readAll(items);
                  setItems((c) => c.map((i) => ({ ...i, status: 'READ' as const })));
                }}
                hitSlop={8}
                testID="inbox-mark-all-read">
                <Text style={styles.markAll}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(row, idx) => (row.k === 'item' ? `we-${keyOf(row.item)}-${idx}` : row.k)}
        contentContainerStyle={[styles.content, rows.length === 0 && { flexGrow: 1 }]}
        ListEmptyComponent={
          loaded ? <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up." /> : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  count: { color: colors.muted, fontSize: 13 },
  markAll: { color: colors.primary, fontWeight: '600' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 14 },
  action: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  unread: { backgroundColor: colors.primarySoft, borderColor: '#BFDDFB' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { color: colors.muted, fontSize: 13 },
  time: { color: colors.muted, fontSize: 11 },
});
