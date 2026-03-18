import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../src/theme';
import { api } from '../src/api';
import { useCurrency } from '../src/currency';

export default function ListingBuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currency } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.getItems();
      // Filter to items that are ready to list (have photos, details)
      const listable = data.filter((i: any) => 
        i.status !== 'sold' && i.status !== 'completed' && i.title
      );
      setItems(listable);
    } catch (e) {
      console.error('Failed to load items:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateListingText = (item: any) => {
    const lines: string[] = [];
    
    // Title
    lines.push(`📦 ${item.title?.toUpperCase() || 'ITEM FOR SALE'}`);
    lines.push('');
    
    // Brand & Category
    if (item.brand) lines.push(`🏷️ Brand: ${item.brand}`);
    if (item.category) lines.push(`📂 Category: ${item.category}`);
    lines.push('');
    
    // Condition
    if (item.condition) {
      const conditionEmoji = {
        'new': '✨',
        'like_new': '🌟',
        'excellent': '👌',
        'good': '👍',
        'fair': '🤝',
        'poor': '⚠️',
      }[item.condition] || '📋';
      lines.push(`${conditionEmoji} Condition: ${item.condition.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`);
    }
    
    // Size
    if (item.size) lines.push(`📏 Size: ${item.size}`);
    
    // Color
    if (item.color) lines.push(`🎨 Color: ${item.color}`);
    
    // Measurements (if available)
    if (item.measurements) {
      lines.push('');
      lines.push('📐 Measurements:');
      if (typeof item.measurements === 'object') {
        Object.entries(item.measurements).forEach(([key, val]) => {
          if (val) lines.push(`   • ${key}: ${val}`);
        });
      } else {
        lines.push(`   ${item.measurements}`);
      }
    }
    
    lines.push('');
    
    // Price
    if (item.listed_price || item.expected_sale_price) {
      const price = item.listed_price || item.expected_sale_price;
      lines.push(`💰 Price: ${currency.symbol}${price}`);
    }
    
    // SKU
    if (item.sku || item.id) {
      lines.push(`🔖 SKU: ${item.sku || item.id.slice(0, 8).toUpperCase()}`);
    }
    
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('');
    
    // Additional notes
    if (item.notes) {
      lines.push('📝 Notes:');
      lines.push(item.notes);
      lines.push('');
    }
    
    // Footer
    lines.push('🚚 Fast shipping • 💬 Questions welcome');
    lines.push('');
    lines.push('#reseller #vintage #fashion #thrift');
    
    return lines.join('\n');
  };

  const selectItem = (item: any) => {
    setSelectedItem(item);
    setGeneratedText(generateListingText(item));
    setCopied(false);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Listing Builder</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + space[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Selector */}
        <Text style={styles.sectionTitle}>Select an Item</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.itemsScroll}
          contentContainerStyle={styles.itemsContainer}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                selectedItem?.id === item.id && styles.itemCardSelected
              ]}
              onPress={() => selectItem(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.itemBrand}>{item.brand || 'No brand'}</Text>
              {item.listed_price && (
                <Text style={styles.itemPrice}>{currency.symbol}{item.listed_price}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Generated Listing */}
        {selectedItem && (
          <>
            <View style={styles.generatedHeader}>
              <Text style={styles.sectionTitle}>Generated Listing</Text>
              <TouchableOpacity 
                style={[styles.copyBtn, copied && styles.copyBtnCopied]}
                onPress={copyToClipboard}
                activeOpacity={0.7}
              >
                <Feather name={copied ? "check" : "copy"} size={16} color={copied ? colors.success : colors.brand} />
                <Text style={[styles.copyBtnText, copied && styles.copyBtnTextCopied]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewCard}>
              <TextInput
                style={styles.previewText}
                value={generatedText}
                onChangeText={setGeneratedText}
                multiline
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.hint}>
              Tip: Edit the text above to customize, then copy to paste into your listing platform.
            </Text>
          </>
        )}

        {!selectedItem && items.length > 0 && (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Select an item above</Text>
            <Text style={styles.emptyText}>
              Choose an item from your inventory to generate a professional listing description.
            </Text>
          </View>
        )}

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="package" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No items to list</Text>
            <Text style={styles.emptyText}>
              Add items to your inventory first, then come back to generate listings.
            </Text>
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => router.push('/quick-add')}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={18} color={colors.textInverse} />
              <Text style={styles.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: space[4],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: space[3],
    marginTop: space[4],
  },
  itemsScroll: {
    marginHorizontal: -spacing.screenPadding,
  },
  itemsContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: space[3],
  },
  itemCard: {
    width: 140,
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  itemCardSelected: {
    borderColor: colors.brand,
  },
  itemTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  itemBrand: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: space[2],
  },
  itemPrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.brand,
  },
  generatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  copyBtnCopied: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  copyBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.brand,
  },
  copyBtnTextCopied: {
    color: colors.success,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
    minHeight: 300,
    ...shadows.sm,
  },
  previewText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.6,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: space[3],
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[12],
  },
  emptyTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginTop: space[4],
    marginBottom: space[2],
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: fontSize.sm * 1.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.brand,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    borderRadius: radius.full,
    marginTop: space[4],
  },
  addBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
