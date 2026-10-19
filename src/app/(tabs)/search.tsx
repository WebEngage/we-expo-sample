import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { track } from '@/analytics/tracking';
import { CustomDataEditor, resolveCustomData } from '@/components/CustomDataEditor';
import { ProductGrid } from '@/components/ProductGrid';
import { Chip, EmptyState, SectionTitle } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, PRODUCTS } from '@/data/products';
import type { CategorySlug, CustomAttr } from '@/types';

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
];

export default function Search() {
  const { recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategorySlug | 'all'>('all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [customData, setCustomData] = useState<CustomAttr[]>([]);

  const submit = (q: string) => {
    const extra = resolveCustomData(customData);
    if (!extra) return;
    setInput(q);
    setQuery(q.trim());
    addRecentSearch(q);
    if (q.trim()) track('Product Searched', { Query: q.trim(), Category: category, Sort: sort }, extra);
  };

  const results = useMemo(() => {
    const q = query.toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.includes(q)),
    );
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [query, category, sort]);

  const searched = query.length > 0 || category !== 'all';

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, brands, categories"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          returnKeyType="search"
          onSubmitEditing={() => submit(input)}
          autoCorrect={false}
          testID="search-input"
        />
        {input.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.muted}
            onPress={() => {
              setInput('');
              setQuery('');
            }}
          />
        )}
      </View>

      <CustomDataEditor rows={customData} onChange={setCustomData} testIDPrefix="search-custom" />

      {recentSearches.length > 0 && !query && (
        <View style={{ gap: 10 }}>
          <SectionTitle action={{ label: 'Clear', onPress: clearRecentSearches }}>Recent searches</SectionTitle>
          <View style={styles.wrapRow}>
            {recentSearches.map((r) => (
              <Chip key={r} label={r} onPress={() => submit(r)} testID={`recent-search-${r}`} />
            ))}
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All" active={category === 'all'} onPress={() => setCategory('all')} testID="search-filter-all" />
        {CATEGORIES.map((c) => (
          <Chip key={c.slug} label={c.name} active={category === c.slug} onPress={() => setCategory(c.slug)} testID={`search-filter-${c.slug}`} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SORTS.map((s) => (
          <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} testID={`search-sort-${s.key}`} />
        ))}
      </ScrollView>

      {searched && <Text style={styles.count}>{results.length} result(s)</Text>}

      {results.length === 0 ? (
        <EmptyState icon="search-outline" title="No products found" subtitle="Try a different keyword or filter." />
      ) : (
        <ProductGrid products={results} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  chipRow: { gap: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  count: { color: colors.muted },
});
