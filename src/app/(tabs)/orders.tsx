import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders } from '../../lib/orderService';
import { Order } from '../../types';

export default function OrdersScreen() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const userOrders = await getUserOrders(profile?.uid || 'guest-user');
      setOrders(userOrders);
    } catch (e) {
      console.warn('Failed to load orders', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isServed = item.status === 'served';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/qrpass',
            params: { orderId: item.id },
          })
        }
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate}>
              📅 {item.pickupDate} • {item.slot}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isServed ? styles.statusBadgeServed : styles.statusBadgeActive,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {isServed ? 'SERVED' : 'CONFIRMED'}
            </Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((it, idx) => (
            <Text key={idx} style={styles.itemText} numberOfLines={1}>
              • {it.quantity}x {it.name}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.counterText}>📍 {item.counter}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total:</Text>
            <Text style={styles.totalPrice}>₹{item.total}</Text>
          </View>
        </View>

        <View style={styles.viewPassRow}>
          <Text style={styles.viewPassText}>Tap to view Scannable QR Pass →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 My Orders</Text>
        <Text style={styles.subtitle}>Track meals & show QR passes</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>
            Order something delicious from the canteen or create a test pass!
          </Text>
          <TouchableOpacity
            style={styles.orderNowBtn}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.orderNowBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4ADE80"
            />
          }
        />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E382B',
  },
  title: {
    color: '#F0FDF4',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#162C22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#244736',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    color: '#F0FDF4',
    fontSize: 16,
    fontWeight: '800',
  },
  orderDate: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#166534',
  },
  statusBadgeServed: {
    backgroundColor: '#1E40AF',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  itemsList: {
    backgroundColor: '#0F1F1A',
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
    gap: 4,
  },
  itemText: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  counterText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  totalPrice: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '800',
  },
  viewPassRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#244736',
    alignItems: 'center',
  },
  viewPassText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F0FDF4',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  orderNowBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  orderNowBtnText: {
    color: '#0F1F1A',
    fontSize: 14,
    fontWeight: '800',
  },
});
