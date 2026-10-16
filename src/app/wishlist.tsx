import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ProductGrid } from '@/components/ProductGrid';
import { Button, EmptyState } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { PRODUCTS } from '@/data/products';

export default function Wishlist() {
  const router = useRouter();
  const { wishlist } = useApp();
  const products = PRODUCTS.filter((p) => wishlist.includes(p.id));

  if (products.length === 0) {
    return (
      <EmptyState icon="heart-outline" title="Your wishlist is empty" subtitle="Tap the heart on any product to save it here.">
        <Button title="Browse products" onPress={() => router.replace('/')} style={{ marginTop: 8 }} />
      </EmptyState>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProductGrid products={products} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
});
