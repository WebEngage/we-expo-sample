import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductGrid } from '@/components/ProductGrid';
import { PromoBanner } from '@/components/PromoBanner';
import { Button, SectionTitle } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, PRODUCTS } from '@/data/products';

export default function Home() {
  const router = useRouter();
  const { user } = useApp();
  const featured = PRODUCTS.slice(0, 6);
  const trending = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hi, {user?.firstName || 'there'} 👋</Text>

      <View style={styles.hero}>
        <Text style={styles.heroKicker}>NEW SEASON</Text>
        <Text style={styles.heroTitle}>Up to 30% off{'\n'}on everyday essentials</Text>
        <Button
          title="Shop Now"
          icon="arrow-forward"
          variant="secondary"
          onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: 'all' } })}
          style={styles.heroBtn}
          testID="home-shop-now"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.slug}
            style={styles.cat}
            onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })}
            testID={`home-category-${c.slug}`}>
            <View style={styles.catIcon}>
              <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.primary} />
            </View>
            <Text style={styles.catName}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <PromoBanner />

      <SectionTitle action={{ label: 'See all', onPress: () => router.push({ pathname: '/category/[slug]', params: { slug: 'all' } }) }}>
        Featured
      </SectionTitle>
      <ProductGrid products={featured} />

      <SectionTitle>Trending now</SectionTitle>
      <ProductGrid products={trending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 32 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20, gap: 8 },
  heroKicker: { color: '#CFE6FF', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30 },
  heroBtn: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#fff' },
  cats: { gap: 14, paddingVertical: 2 },
  cat: { alignItems: 'center', gap: 6, width: 72 },
  catIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 12, color: colors.text, fontWeight: '600' },
});
