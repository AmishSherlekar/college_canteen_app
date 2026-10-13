import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>⚙️ Admin Dashboard</Text>
      <Text style={styles.sub}>Coming in Stage 5</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1F1A', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F0FDF4', fontSize: 24, fontWeight: '800' },
  sub: { color: '#6B7280', fontSize: 14, marginTop: 8 },
});
