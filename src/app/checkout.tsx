import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrderClient } from '../lib/orderService';
import { OrderItem } from '../types';

const SLOTS = [
  '12:00 PM – 12:30 PM',
  '12:30 PM – 1:00 PM',
  '1:00 PM – 1:30 PM',
  '1:30 PM – 2:00 PM',
];

const COUNTERS = [
  'Counter A (Meals & Thali)',
  'Counter B (Snacks & Fast Food)',
  'Counter C (Beverages & Deserts)',
];

export default function CheckoutScreen() {
  const { profile } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const params = useLocalSearchParams<{ date?: string }>();
  const pickupDate = params.date || new Date().toISOString().split('T')[0];

  const [selectedSlot, setSelectedSlot] = useState(SLOTS[1]);
  const [selectedCounter, setSelectedCounter] = useState(COUNTERS[0]);
  const [submitting, setSubmitting] = useState(false);

  const orderItems: OrderItem[] = cartItems.map((item) => ({
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  const total = cartTotal;

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrderClient({
        uid: profile?.uid || 'guest-user',
        pickupDate,
        slot: selectedSlot,
        counter: selectedCounter,
        items: orderItems,
        total,
      });

      clearCart();

      // Navigate directly to the QR Pass screen
      router.replace({
        pathname: '/(tabs)/qrpass',
        params: { orderId: order.id },
      });
    } catch (err: any) {
      console.error('Order creation error:', err);
      Alert.alert('Error', err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Order</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Items Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🍽️ Selected Items</Text>
          {orderItems.map((item) => (
            <View key={item.menuItemId} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>
                  ₹{item.price} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        {/* Pickup Time Slot */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>⏰ Pickup Time Slot</Text>
          <View style={styles.chipGrid}>
            {SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pickup Counter */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>📍 Pickup Counter</Text>
          <View style={styles.chipGrid}>
            {COUNTERS.map((counter) => {
              const isSelected = selectedCounter === counter;
              return (
                <TouchableOpacity
                  key={counter}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedCounter(counter)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {counter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Notice */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoEmoji}>💳</Text>
          <Text style={styles.infoText}>
            Simulated Free-Tier Payment: Your order will be confirmed immediately and a scannable QR Pass will be generated.
          </Text>
        </View>
      </ScrollView>

      {/* Footer / Submit Button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerSub}>Total Amount</Text>
          <Text style={styles.footerPrice}>₹{total}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#0F1F1A" />
          ) : (
            <Text style={styles.confirmBtnText}>Generate QR Pass →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1F1A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E382B',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1E382B',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#4ADE80',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    color: '#F0FDF4',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#162C22',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#244736',
  },
  cardHeader: {
    color: '#F0FDF4',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  itemQty: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
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
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
  },
  chipGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E382B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D5541',
  },
  chipActive: {
    backgroundColor: '#15803D',
    borderColor: '#4ADE80',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F0FDF4',
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13281E',
    borderWidth: 1,
    borderColor: '#22543D',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoText: {
    color: '#86EFAC',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#162C22',
    borderTopWidth: 1,
    borderTopColor: '#244736',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  footerInfo: {
    flexDirection: 'column',
  },
  footerSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  footerPrice: {
    color: '#4ADE80',
    fontSize: 22,
    fontWeight: '800',
  },
  confirmBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#0F1F1A',
    fontSize: 15,
    fontWeight: '800',
  },
});
