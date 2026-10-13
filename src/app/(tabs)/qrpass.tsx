import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders, createOrderClient } from '../../lib/orderService';
import { Order } from '../../types';

export default function QRPassScreen() {
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingDemo, setCreatingDemo] = useState(false);

  // Load latest order or order by param
  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await getUserOrders(profile?.uid || 'guest-user');
      if (params.orderId) {
        const found = orders.find((o) => o.id === params.orderId);
        if (found) {
          setActiveOrder(found);
          setLoading(false);
          return;
        }
      }
      if (orders.length > 0) {
        setActiveOrder(orders[0]);
      } else {
        setActiveOrder(null);
      }
    } catch (e) {
      console.warn('Error loading orders:', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.uid, params.orderId]);

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [loadOrder])
  );

  // Listen to active order updates in real-time
  useEffect(() => {
    if (!activeOrder?.id) return;
    try {
      const unsub = onSnapshot(
        doc(db, 'orders', activeOrder.id),
        (snap) => {
          if (snap.exists()) {
            setActiveOrder({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) });
          }
        },
        () => {
          // Ignore offline / not found error
        }
      );
      return unsub;
    } catch {
      return undefined;
    }
  }, [activeOrder?.id]);

  // Instant demo order creation for testing QR and scanner
  const handleCreateDemoPass = async () => {
    setCreatingDemo(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const tomorrow = d.toISOString().split('T')[0];

      const demoOrder = await createOrderClient({
        uid: profile?.uid || 'guest-user',
        pickupDate: tomorrow,
        slot: '12:30 PM – 1:00 PM',
        counter: 'Counter A (Fast Track)',
        items: [
          {
            menuItemId: 'sample-1',
            name: 'Paneer Butter Masala + 2 Rotis',
            price: 60,
            quantity: 1,
          },
          {
            menuItemId: 'sample-7',
            name: 'Special Masala Chai',
            price: 12,
            quantity: 1,
          },
        ],
        total: 72,
      });
      setActiveOrder(demoOrder);
    } catch (e: any) {
      console.error('Failed to create demo pass:', e);
    } finally {
      setCreatingDemo(false);
    }
  };

  const handleShare = async () => {
    if (!activeOrder) return;
    await Share.share({
      message: `Canteen Meal Pass\nOrder ID: ${activeOrder.id}\nItems: ${activeOrder.items
        .map((i) => `${i.name} x${i.quantity}`)
        .join(', ')}\nTotal: ₹${activeOrder.total}\nPickup: ${activeOrder.slot} at ${activeOrder.counter}`,
    });
  };

  const isServed = activeOrder?.status === 'served';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎫 Canteen Meal Pass</Text>
        {activeOrder && (
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Text style={styles.shareText}>📤 Share</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4ADE80" />
            <Text style={styles.sub}>Loading your pass…</Text>
          </View>
        ) : !activeOrder ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎟️</Text>
            <Text style={styles.emptyTitle}>No Active Meal Pass</Text>
            <Text style={styles.emptySub}>
              You haven't placed an order yet. You can order from the menu or generate an instant test pass right now!
            </Text>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={handleCreateDemoPass}
              disabled={creatingDemo}
              activeOpacity={0.8}
            >
              {creatingDemo ? (
                <ActivityIndicator color="#0F1F1A" />
              ) : (
                <Text style={styles.demoBtnText}>⚡ Generate Instant Sample Pass</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.browseBtnText}>Browse Menu Items →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.passCard}>
            {/* Status Header */}
            <View
              style={[
                styles.statusBar,
                isServed ? styles.statusBarServed : styles.statusBarActive,
              ]}
            >
              <Text style={styles.statusEmoji}>{isServed ? '✅' : '🟢'}</Text>
              <Text style={styles.statusText}>
                {isServed ? 'SERVED / REDEEMED' : 'CONFIRMED — READY TO SCAN'}
              </Text>
            </View>

            {/* QR Code Container */}
            <View style={styles.qrWrapper}>
              <View style={styles.qrBackground}>
                <QRCode
                  value={activeOrder.qrToken || activeOrder.id}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
              <Text style={styles.orderIdText}>Order #{activeOrder.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.scanInstruction}>
                {isServed
                  ? 'This pass has already been used and redeemed.'
                  : 'Show this QR at the canteen counter to receive food.'}
              </Text>
            </View>

            {/* Order Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📍 Counter</Text>
                <Text style={styles.detailValue}>{activeOrder.counter}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⏰ Slot</Text>
                <Text style={styles.detailValue}>{activeOrder.slot}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 Date</Text>
                <Text style={styles.detailValue}>{activeOrder.pickupDate}</Text>
              </View>
            </View>

            {/* Items List */}
            <View style={styles.itemsSection}>
              <Text style={styles.itemsTitle}>Items in this order:</Text>
              {activeOrder.items.map((i, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {i.quantity}x {i.name}
                  </Text>
                  <Text style={styles.itemPrice}>₹{i.price * i.quantity}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalPrice}>₹{activeOrder.total}</Text>
              </View>
            </View>

            {/* Test Action */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.testScannerBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/scanner',
                    params: { orderId: activeOrder.id, token: activeOrder.qrToken },
                  })
                }
              >
                <Text style={styles.testScannerBtnText}>📷 Open Scanner to Scan This Pass →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E382B',
  },
  headerTitle: {
    color: '#F0FDF4',
    fontSize: 20,
    fontWeight: '800',
  },
  shareBtn: {
    backgroundColor: '#1E382B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F0FDF4',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  demoBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoBtnText: {
    color: '#0F1F1A',
    fontSize: 15,
    fontWeight: '800',
  },
  browseBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  browseBtnText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
  },
  passCard: {
    backgroundColor: '#162C22',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#244736',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  statusBarActive: {
    backgroundColor: '#166534',
  },
  statusBarServed: {
    backgroundColor: '#1E3A8A',
  },
  statusEmoji: {
    fontSize: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  qrWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#12241C',
  },
  qrBackground: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderIdText: {
    color: '#F0FDF4',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: 1,
  },
  scanInstruction: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
  detailsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#244736',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  detailValue: {
    color: '#F0FDF4',
    fontSize: 13,
    fontWeight: '700',
  },
  itemsSection: {
    padding: 16,
  },
  itemsTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    color: '#E2E8F0',
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#244736',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#F0FDF4',
    fontSize: 15,
    fontWeight: '700',
  },
  totalPrice: {
    color: '#4ADE80',
    fontSize: 20,
    fontWeight: '800',
  },
  actionSection: {
    padding: 16,
    paddingTop: 4,
  },
  testScannerBtn: {
    backgroundColor: '#22543D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  testScannerBtnText: {
    color: '#86EFAC',
    fontSize: 13,
    fontWeight: '700',
  },
});
