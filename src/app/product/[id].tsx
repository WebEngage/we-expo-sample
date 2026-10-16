import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { CustomDataEditor, resolveCustomData } from '@/components/CustomDataEditor';
import { Button, Chip, EmptyState, QuantityStepper } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getProduct } from '@/data/products';
import type { CustomAttr } from '@/types';
import { money } from '@/utils/format';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist, showToast } = useApp();
  const product = getProduct(id);

  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>(product?.colors?.[0]);
  const [qty, setQty] = useState(1);
  const [customData, setCustomData] = useState<CustomAttr[]>([]);

  if (!product) return <EmptyState icon="alert-circle-outline" title="Product not found" />;

  const liked = wishlist.includes(product.id);
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const validate = () => {
    if (product.sizes && !size) {
      showToast('Please select a size');
      return null;
    }
    return resolveCustomData(customData);
  };

  const onAddToCart = () => {
    const extra = validate();
    if (!extra) return;
    addToCart(product, { qty, size, color, extra });
    showToast(`${product.name} added to cart`);
  };

  const onBuyNow = () => {
    const extra = validate();
    if (!extra) return;
    addToCart(product, { qty, size, color, extra });
    router.push('/checkout');
  };

  const onWishlist = () => {
    const extra = resolveCustomData(customData);
    if (!extra) return;
    showToast(toggleWishlist(product.id, extra) ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const onShare = async () => {
    const extra = resolveCustomData(customData);
    if (!extra) return;
    try {
      await Share.share({ message: `Check out ${product.name} on WE Shop for ${money(product.price)}` });
    } catch {
      // share sheet dismissed or unavailable
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: product.category.charAt(0).toUpperCase() + product.category.slice(1) }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={150} />

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.name} testID="product-name">
              {product.name}
            </Text>
          </View>
          <View style={styles.iconRow}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? colors.danger : colors.text} onPress={onWishlist} testID="product-wishlist" />
            <Ionicons name="share-social-outline" size={26} color={colors.text} onPress={onShare} testID="product-share" />
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price} testID="product-price">
            {money(product.price)}
          </Text>
          <Text style={styles.mrp}>{money(product.mrp)}</Text>
          <Text style={styles.off}>{off}% off</Text>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={colors.accent} />
          <Text style={styles.rating}>
            {product.rating} · {product.reviews} reviews
          </Text>
        </View>

        <Text style={styles.desc}>{product.description}</Text>

        {product.sizes && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Size</Text>
            <View style={styles.chips}>
              {product.sizes.map((s) => (
                <Chip key={s} label={s} active={size === s} onPress={() => setSize(s)} testID={`product-size-${s}`} />
              ))}
            </View>
          </View>
        )}

        {product.colors && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Colour</Text>
            <View style={styles.chips}>
              {product.colors.map((c) => (
                <Chip key={c} label={c} active={color === c} onPress={() => setColor(c)} testID={`product-color-${c}`} />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.block, styles.qtyRow]}>
          <Text style={styles.blockTitle}>Quantity</Text>
          <QuantityStepper qty={qty} onChange={(q) => setQty(Math.max(1, q))} testID="product-qty" />
        </View>

        <CustomDataEditor rows={customData} onChange={setCustomData} testIDPrefix="product-custom" />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Add to Cart" variant="secondary" icon="cart-outline" onPress={onAddToCart} style={{ flex: 1 }} testID="product-add-to-cart" />
        <Button title="Buy Now" onPress={onBuyNow} style={{ flex: 1 }} testID="product-buy-now" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconRow: { flexDirection: 'row', gap: 14, paddingTop: 4 },
  brand: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  price: { fontSize: 26, fontWeight: '800', color: colors.text },
  mrp: { fontSize: 15, color: colors.muted, textDecorationLine: 'line-through' },
  off: { fontSize: 15, color: colors.success, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rating: { color: colors.muted },
  desc: { color: colors.text, lineHeight: 21 },
  block: { gap: 8 },
  blockTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
