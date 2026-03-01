import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          // Root layout will redirect to sign-in once session clears
        },
      },
    ]);
  }

  const email = session?.user?.email ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* Account section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{email}</Text>
          </View>
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
          onPress={handleSignOut}
          activeOpacity={0.8}
          disabled={signingOut}>
          {signingOut ? (
            <ActivityIndicator color="#D94F4F" size="small" />
          ) : (
            <Text style={styles.signOutLabel}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingTop: 16,
  },

  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.iconInactive,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Palette.text,
  },
  rowValue: {
    fontSize: 14,
    color: Palette.iconInactive,
    flexShrink: 1,
    textAlign: 'right',
  },

  signOutBtn: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D94F4F40',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  signOutBtnDisabled: {
    opacity: 0.5,
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D94F4F',
  },
});
