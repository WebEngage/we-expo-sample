import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { ProductGrid } from '@/components/ProductGrid';
import { Chip, EmptyState } from '@/components/ui';
import { colors } from '@/constants/theme';
import { CATEGORIES, PRODUCTS } from '@/data/products';

type Sort = 'popular' | 'price-asc' | 'price-desc';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [sort, setSort] = useState<Sort>('popular');

  const category = CATEGORIES.find((c) => c.slug === slug);
  const title = category?.name ?? 'All products';

  const products = useMemo(() => {
    const list = PRODUCTS.filter((p) => !category || p.category === category.slug);
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    return [...list].sort((a, b) => b.reviews - a.reviews);
  }, [category, sort]);

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Popular" active={sort === 'popular'} onPress={() => setSort('popular')} testID="category-sort-popular" />
          <Chip label="Price: low to high" active={sort === 'price-asc'} onPress={() => setSort('price-asc')} testID="category-sort-price-asc" />
          <Chip label="Price: high to low" active={sort === 'price-desc'} onPress={() => setSort('price-desc')} testID="category-sort-price-desc" />
        </ScrollView>
        <Text style={styles.count}>{products.length} products</Text>
        {products.length === 0 ? <EmptyState icon="pricetags-outline" title="Nothing here yet" /> : <ProductGrid products={products} />}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  count: { color: colors.muted },
});
