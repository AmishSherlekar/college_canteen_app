import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const isStaff = profile?.role === 'staff';
  const isAdmin = profile?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: isStaff ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: isStaff ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="qrpass"
        options={{
          href: isStaff ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎫" label="QR Pass" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📷" label="Scanner" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: !isAdmin ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="Admin" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A2E25',
    borderTopWidth: 1,
    borderTopColor: '#2D4A3B',
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.45,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#4ADE80',
  },
});
