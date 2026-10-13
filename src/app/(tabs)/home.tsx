import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useMenu } from '../../hooks/useMenu';
import { MenuItem } from '../../types';
import { router } from 'expo-router';

/** Returns tomorrow's date as 'YYYY-MM-DD' */
function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/** Check if pre-order window is open (enabled for testing sample foods) */
function isOrderingOpen(): boolean {
  return true;
}

/** Group menu items by category */
function groupByCategory(items: MenuItem[]): { category: string; items: MenuItem[] }[] {
  const map = new Map<string, MenuItem[]>();
  items.forEach((item) => {
    const cat = item.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  });
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

function MenuCard({
  item,
  cartQty,
  onAdd,
  onRemove,
  orderingOpen,
}: {
  item: MenuItem;
  cartQty: number;
  onAdd: () => void;
  onRemove: () => void;
  orderingOpen: boolean;
}) {
  const remaining = item.maxQty - item.orderedCount;
  const isSoldOut = remaining <= 0;

  return (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.placeholderEmoji}>🍛</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          {isSoldOut ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          ) : !orderingOpen ? (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>Closed</Text>
            </View>
          ) : cartQty > 0 ? (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{cartQty}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, cartQty >= remaining && styles.qtyBtnDisabled]}
                onPress={onAdd}
                disabled={cartQty >= remaining}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        {remaining < 10 && !isSoldOut && (
          <Text style={styles.stockWarning}>Only {remaining} left!</Text>
        )}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { profile, signOut } = useAuth();
  const { cart, cartCount, cartTotal, addToCart, removeFromCart } = useCart();
  const tomorrow = getTomorrowDate();
  const { items, loading, error, isSampleData, seedToFirebase } = useMenu(tomorrow);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const orderingOpen = isOrderingOpen();

  const handleSeed = async () => {
    setSeeding(true);
    await seedToFirebase();
    setSeeding(false);
  };

  const grouped = groupByCategory(items);

  const renderSection = ({ item: section }: { item: { category: string; items: MenuItem[] } }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.category}</Text>
      {section.items.map((menuItem) => (
        <MenuCard
          key={menuItem.id}
          item={menuItem}
          cartQty={cart[menuItem.id] ?? 0}
          onAdd={() => addToCart(menuItem)}
          onRemove={() => removeFromCart(menuItem.id)}
          orderingOpen={orderingOpen}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {profile?.name?.split(' ')[0] || 'Student'} 👋</Text>
          <Text style={styles.subGreeting}>Tomorrow's Canteen Menu</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sample Data & Quick Seed Banner */}
      {isSampleData && (
        <View style={styles.sampleBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sampleBannerTitle}>🍛 Ready-to-Test Sample Menu</Text>
            <Text style={styles.sampleBannerSub}>
              Showing sample canteen food. Add to cart & generate your QR pass!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.seedBtn}
            onPress={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <ActivityIndicator size="small" color="#0F1F1A" />
            ) : (
              <Text style={styles.seedBtnText}>Sync to Firebase</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Date chip */}
      <View style={styles.dateChip}>
        <Text style={styles.dateChipText}>
          📅 Pickup: {new Date(tomorrow + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short',
          })}
        </Text>
      </View>

      {/* Menu list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>Loading menu…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyText}>No menu for tomorrow yet.</Text>
          <Text style={styles.emptySubText}>Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(s) => s.category}
          renderItem={renderSection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor="#4ADE80" />
          }
        />
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBtn}
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: '/checkout' as any,
              params: { date: tomorrow },
            })
          }
        >
          <View style={styles.cartBtnLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBtnText}>View Cart</Text>
          </View>
          <Text style={styles.cartTotal}>₹{cartTotal}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F0FDF4',
  },
  subGreeting: {
    fontSize: 13,
    color: '#6EE7B7',
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: '#1A3329',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D4A3B',
  },
  signOutText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3329',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2D5A3E',
  },
  bannerClosed: {
    borderColor: '#7F1D1D',
    backgroundColor: '#1C0A0A',
  },
  bannerEmoji: { fontSize: 16 },
  bannerText: {
    color: '#86EFAC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  dateChip: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#0F2E1E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1F4A32',
  },
  dateChipText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 12,
  },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1A2E25',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D4A3B',
  },
  cardImage: {
    width: 90,
    height: 90,
  },
  cardImagePlaceholder: {
    backgroundColor: '#1F3D2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 32 },
  cardBody: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0FDF4',
  },
  itemCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ADE80',
  },
  addBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addBtnText: {
    color: '#0F1F1A',
    fontWeight: '700',
    fontSize: 13,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1F1A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ADE80',
  },
  qtyBtnDisabled: { backgroundColor: '#1A3329' },
  qtyBtnText: {
    color: '#0F1F1A',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  qtyText: {
    color: '#F0FDF4',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 10,
  },
  soldOutBadge: {
    backgroundColor: '#3F1515',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  soldOutText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  closedBadge: {
    backgroundColor: '#1C1C1C',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  closedText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  stockWarning: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { color: '#6EE7B7', fontSize: 14 },
  errorText: { color: '#FCA5A5', fontSize: 14 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#F0FDF4', fontSize: 18, fontWeight: '700' },
  emptySubText: { color: '#6B7280', fontSize: 13 },
  cartBtn: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#4ADE80',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBadge: {
    backgroundColor: '#0F1F1A',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#4ADE80', fontSize: 12, fontWeight: '800' },
  cartBtnText: { color: '#0F1F1A', fontSize: 16, fontWeight: '800' },
  cartTotal: { color: '#0F1F1A', fontSize: 16, fontWeight: '800' },
  sampleBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1E382B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2D5541',
  },
  sampleBannerTitle: {
    color: '#86EFAC',
    fontSize: 13,
    fontWeight: '800',
  },
  sampleBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  seedBtn: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedBtnText: {
    color: '#0F1F1A',
    fontSize: 11,
    fontWeight: '800',
  },
});
