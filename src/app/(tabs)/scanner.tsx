import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { getOrderById, verifyAndServeClient, getUserOrders } from '../../lib/orderService';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';

export default function ScannerScreen() {
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string; token?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualId, setManualId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [resultModal, setResultModal] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Load recent orders for easy one-tap testing in emulator
  useEffect(() => {
    getUserOrders(profile?.uid || 'guest-user').then((orders) => {
      setRecentOrders(orders.slice(0, 3));
    });
  }, [profile?.uid, resultModal]);

  // If orderId was passed as param (e.g. from QR Pass test button)
  useEffect(() => {
    if (params.orderId) {
      handleProcessOrderId(params.orderId);
    }
  }, [params.orderId]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);

    let targetOrderId = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.orderId) {
        targetOrderId = parsed.orderId;
      }
    } catch {
      // plain text order ID
      targetOrderId = data.trim();
    }

    handleProcessOrderId(targetOrderId);
  };

  const handleProcessOrderId = async (orderId: string) => {
    if (!orderId) return;
    setProcessing(true);
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        Alert.alert('Not Found', `Order #${orderId} does not exist in the database.`, [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
        setProcessing(false);
        return;
      }
      setScannedOrder(order);
      setResultModal(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to fetch order');
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleServeOrder = async () => {
    if (!scannedOrder) return;
    setProcessing(true);
    try {
      const result = await verifyAndServeClient(scannedOrder.id);
      if (result.success && result.order) {
        setScannedOrder(result.order);
        Alert.alert(
          '🎉 Order Served!',
          `Order #${scannedOrder.id.slice(-6).toUpperCase()} has been marked as SERVED in Firebase. You may hand over the meal.`
        );
      } else {
        Alert.alert('Notice', result.error || 'Could not serve order.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to serve order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setResultModal(false);
    setScannedOrder(null);
    setScanned(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📷 Staff Scanner</Text>
          <Text style={styles.headerSub}>Scan student QR Meal Pass</Text>
        </View>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        {!permission ? (
          <View style={styles.permissionBox}>
            <ActivityIndicator color="#4ADE80" />
            <Text style={styles.permText}>Checking camera permissions…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permEmoji}>📷</Text>
            <Text style={styles.permTitle}>Camera Access Required</Text>
            <Text style={styles.permSub}>
              Camera is needed to scan QR passes at the counter.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            {/* Viewfinder Target Box Overlay */}
            <View style={styles.overlay}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.targetHint}>Align QR code inside frame</Text>
            </View>
          </CameraView>
        )}
      </View>

      {/* Manual / Simulator Testing Tools */}
      <View style={styles.manualSection}>
        <Text style={styles.sectionLabel}>🧪 Test & Simulation Tools</Text>

        {/* Quick test with recent order */}
        {recentOrders.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentRow}
          >
            {recentOrders.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                style={[
                  styles.recentChip,
                  ord.status === 'served' && styles.recentChipServed,
                ]}
                onPress={() => handleProcessOrderId(ord.id)}
              >
                <Text style={styles.recentChipText}>
                  {ord.status === 'served' ? '✅' : '⚡'} Test #{ord.id.slice(-5)} (₹{ord.total})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Manual Order ID Entry */}
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.input}
            placeholder="Or enter Order ID..."
            placeholderTextColor="#6B7280"
            value={manualId}
            onChangeText={setManualId}
          />
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => handleProcessOrderId(manualId.trim())}
            disabled={!manualId.trim() || processing}
          >
            {processing ? (
              <ActivityIndicator color="#0F1F1A" size="small" />
            ) : (
              <Text style={styles.manualBtnText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>

        {scanned && (
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanText}>🔄 Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Order Verification Modal */}
      <Modal visible={resultModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {scannedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalOrderTitle}>
                      Order #{scannedOrder.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.modalSlot}>
                      {scannedOrder.slot} • {scannedOrder.counter}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.modalBadge,
                      scannedOrder.status === 'served'
                        ? styles.modalBadgeServed
                        : styles.modalBadgeConfirmed,
                    ]}
                  >
                    <Text style={styles.modalBadgeText}>
                      {scannedOrder.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.modalItemsList}>
                  <Text style={styles.modalSubHeader}>Order Items:</Text>
                  {scannedOrder.items.map((i, idx) => (
                    <View key={idx} style={styles.modalItemRow}>
                      <Text style={styles.modalItemName}>
                        {i.quantity}x {i.name}
                      </Text>
                      <Text style={styles.modalItemPrice}>₹{i.price * i.quantity}</Text>
                    </View>
                  ))}
                  <View style={styles.modalDivider} />
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalTotalLabel}>Total Amount:</Text>
                    <Text style={styles.modalTotalValue}>₹{scannedOrder.total}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {scannedOrder.status !== 'served' ? (
                    <TouchableOpacity
                      style={styles.serveBtn}
                      onPress={handleServeOrder}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#0F1F1A" />
                      ) : (
                        <Text style={styles.serveBtnText}>
                          ✅ Mark as Served & Hand Over Food
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.alreadyServedBox}>
                      <Text style={styles.alreadyServedText}>
                        ✅ This order has already been served.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E382B',
  },
  headerTitle: {
    color: '#F0FDF4',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 220,
    height: 220,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#4ADE80',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  targetHint: {
    color: '#F0FDF4',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#12241C',
  },
  permEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  permTitle: {
    color: '#F0FDF4',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  permSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  permText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  permBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  permBtnText: {
    color: '#0F1F1A',
    fontWeight: '800',
    fontSize: 14,
  },
  manualSection: {
    padding: 16,
    backgroundColor: '#162C22',
    borderTopWidth: 1,
    borderTopColor: '#244736',
    gap: 10,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recentChip: {
    backgroundColor: '#1E382B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D5541',
  },
  recentChipServed: {
    borderColor: '#1D4ED8',
    backgroundColor: '#172554',
  },
  recentChipText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0F1F1A',
    borderWidth: 1,
    borderColor: '#244736',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F0FDF4',
    fontSize: 13,
  },
  manualBtn: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBtnText: {
    color: '#0F1F1A',
    fontSize: 13,
    fontWeight: '800',
  },
  rescanBtn: {
    backgroundColor: '#1E382B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescanText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#162C22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#244736',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalOrderTitle: {
    color: '#F0FDF4',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSlot: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  modalBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalBadgeConfirmed: {
    backgroundColor: '#166534',
  },
  modalBadgeServed: {
    backgroundColor: '#1E40AF',
  },
  modalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  modalItemsList: {
    backgroundColor: '#0F1F1A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalSubHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalItemName: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  modalItemPrice: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#244736',
    marginVertical: 10,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTotalLabel: {
    color: '#F0FDF4',
    fontSize: 15,
    fontWeight: '700',
  },
  modalTotalValue: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
  },
  modalActions: {
    gap: 10,
  },
  serveBtn: {
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  serveBtnText: {
    color: '#0F1F1A',
    fontSize: 15,
    fontWeight: '800',
  },
  alreadyServedBox: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  alreadyServedText: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
