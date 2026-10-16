import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Product } from '@/types';
import { money } from '@/utils/format';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { wishlist, toggleWishlist, showToast } = useApp();
  const liked = wishlist.includes(product.id);
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      testID={`product-card-${product.id}`}>
      <View>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={150} />
        <Pressable
          style={styles.heart}
          hitSlop={8}
          testID={`wishlist-toggle-${product.id}`}
          onPress={() => showToast(toggleWishlist(product.id) ? 'Added to wishlist' : 'Removed from wishlist')}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.danger : colors.text} />
        </Pressable>
      </View>
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          <Text style={styles.mrp}>{money(product.mrp)}</Text>
          <Text style={styles.off}>{off}% off</Text>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={colors.accent} />
          <Text style={styles.rating}>
            {product.rating} ({product.reviews})
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.border },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    padding: 6,
  },
  info: { padding: 10, gap: 3 },
  brand: { fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
  mrp: { fontSize: 12, color: colors.muted, textDecorationLine: 'line-through' },
  off: { fontSize: 12, color: colors.success, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 12, color: colors.muted },
});
