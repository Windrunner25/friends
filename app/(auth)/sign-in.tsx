// DEV: Email/password sign-in — swap back to OAuth (Apple + Google) before release.
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // Session established → onAuthStateChange fires → _layout.tsx routes to (tabs)
    } catch (err: any) {
      Alert.alert('Sign in failed', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* App identity */}
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <IconSymbol name="person.2.fill" size={32} color={Palette.accent} />
          </View>
          <Text style={styles.appName}>Friends</Text>
          <Text style={styles.tagline}>Stay close to the people who matter.</Text>
        </View>

        {/* Email / password form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Palette.iconInactive}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Palette.iconInactive}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnLabel}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.devNote}>Dev mode — email/password only</Text>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 32,
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Palette.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: Palette.iconInactive,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Palette.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.tabBarBorder,
  },
  btn: {
    backgroundColor: Palette.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
    }),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Dev note
  devNote: {
    fontSize: 11,
    color: Palette.iconInactive,
    textAlign: 'center',
    lineHeight: 16,
  },
});
