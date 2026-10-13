import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in email and password.');
      return;
    }
    if (mode === 'signup' && (!name.trim() || !rollNo.trim())) {
      Alert.alert('Missing fields', 'Please fill in your name and roll number.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim(), rollNo.trim());
      }
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err?.code === 'auth/email-already-in-use'
          ? 'An account already exists with this email.'
          : err?.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : err?.message ?? 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerBlock}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
          <Text style={styles.appName}>Smart Canteen</Text>
          <Text style={styles.tagline}>Pre-order. Pay online. Skip the queue.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Mode toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Aarav Sharma"
                placeholderTextColor="#4B5563"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.label}>Roll Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2024CS001"
                placeholderTextColor="#4B5563"
                value={rollNo}
                onChangeText={setRollNo}
                autoCapitalize="characters"
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@college.edu"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#4B5563"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0F1F1A" />
            ) : (
              <Text style={styles.submitText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Pre-orders close every day at{' '}
          <Text style={{ color: '#4ADE80', fontWeight: '700' }}>9:00 PM</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1F1A',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A3329',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4ADE80',
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F0FDF4',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#6EE7B7',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1A2E25',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D4A3B',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#0F1F1A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#4ADE80',
  },
  toggleText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#0F1F1A',
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#0F1F1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F0FDF4',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D4A3B',
  },
  submitBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#0F1F1A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    marginTop: 28,
  },
});
