import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { tierColor, tierLabel, tierIconName, nudgeIconName, nudgeLabel } from '@/utils/people';
import type { Person, InteractionType } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultTierForType(type: Person['type']): Person['cadence_tier'] {
  return type === 'friend' ? 'close_friend' : 'active';
}

function defaultNudgeForTier(tier: Person['cadence_tier']): InteractionType {
  if (tier === 'close_friend' || tier === 'keep_warm') return 'call';
  if (tier === 'active') return 'text';
  if (tier === 'dont_lose_touch') return 'text';
  return 'text';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TierBubble({ tier }: { tier: Person['cadence_tier'] }) {
  const color = tierColor(tier);
  return (
    <View style={[styles.tierBubble, { backgroundColor: color + '28' }]}>
      <Text style={[styles.tierBubbleText, { color }]}>{tierLabel(tier)}</Text>
    </View>
  );
}

function DetailRow({
  label,
  children,
  onPress,
}: {
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.detailRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        {children}
        {onPress && (
          <IconSymbol name="chevron.right" size={12} color={Palette.iconInactive} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  defaultType?: Person['type'];
  onClose: () => void;
  onSave: (person: Person) => void;
}

export function AddPersonModal({ visible, defaultType = 'friend', onClose, onSave }: Props) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const SHEET_HEIGHT = SCREEN_HEIGHT - 88;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [type, setType] = useState<Person['type']>(defaultType);
  const [tier, setTier] = useState<Person['cadence_tier']>(defaultTierForType(defaultType));
  const [whereFrom, setWhereFrom] = useState<string | undefined>(undefined);
  const [birthday, setBirthday] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [nudge, setNudge] = useState<InteractionType>(defaultNudgeForTier(defaultTierForType(defaultType)));
  const [saving, setSaving] = useState(false);

  const canSave = firstName.trim().length > 0;

  function reset() {
    setFirstName('');
    setLastName('');
    setType(defaultType);
    setTier(defaultTierForType(defaultType));
    setWhereFrom(undefined);
    setBirthday(undefined);
    setPhone(undefined);
    setEmail(undefined);
    setNudge(defaultNudgeForTier(defaultTierForType(defaultType)));
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function editType() {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', 'Friend', 'Network'], cancelButtonIndex: 0 },
      (idx) => {
        if (idx === 1) {
          const newTier = 'close_friend';
          setType('friend');
          setTier(newTier);
          setNudge(defaultNudgeForTier(newTier));
        } else if (idx === 2) {
          const newTier = 'active';
          setType('network');
          setTier(newTier);
          setNudge(defaultNudgeForTier(newTier));
        }
      }
    );
  }

  function editTier() {
    const isFriend = type === 'friend';
    const labels = isFriend
      ? ['Close Friend', 'Keep Warm', "Don't Lose Touch"]
      : ['Active', 'Keep Warm', "Don't Lose Touch"];
    const values: Person['cadence_tier'][] = isFriend
      ? ['close_friend', 'keep_warm', 'dont_lose_touch']
      : ['active', 'keep_warm', 'dont_lose_touch'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', ...labels], cancelButtonIndex: 0 },
      (idx) => {
        if (idx > 0) {
          const val = values[idx - 1];
          setTier(val);
          setNudge(defaultNudgeForTier(val));
        }
      }
    );
  }

  function editWhereFrom() {
    Alert.prompt(
      'Where you know them from',
      '',
      (text) => {
        setWhereFrom(text.trim() || undefined);
      },
      'plain-text',
      whereFrom ?? '',
    );
  }

  function editBirthday() {
    Alert.prompt(
      'Birthday',
      'Format: YYYY-MM-DD',
      (text) => {
        const trimmed = text.trim() || undefined;
        if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          Alert.alert('Invalid date', 'Please use YYYY-MM-DD format (e.g. 1990-06-15).');
          return;
        }
        setBirthday(trimmed);
      },
      'plain-text',
      birthday ?? '',
    );
  }

  function editPhone() {
    Alert.prompt(
      'Phone number',
      '',
      (text) => { setPhone(text.trim() || undefined); },
      'plain-text',
      phone ?? '',
    );
  }

  function editEmail() {
    Alert.prompt(
      'Email address',
      '',
      (text) => { setEmail(text.trim() || undefined); },
      'plain-text',
      email ?? '',
    );
  }

  function editNudge() {
    const labels = ['Call', 'FaceTime', 'Text', 'Email', 'In Person'];
    const values: InteractionType[] = ['call', 'facetime', 'text', 'email', 'in_person'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', ...labels], cancelButtonIndex: 0 },
      (idx) => {
        if (idx > 0) setNudge(values[idx - 1]);
      }
    );
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Not authenticated.');
      setSaving(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const insert = {
      user_id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      type,
      cadence_tier: tier,
      where_from: whereFrom ?? null,
      birthday: birthday ?? null,
      phone: phone ?? null,
      email: email ?? null,
      nudge_interaction_type: nudge,
      date_added: today,
    };

    const { data, error } = await supabase.from('people').insert(insert).select().single();

    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'Could not save. Please try again.');
      setSaving(false);
      return;
    }

    const newPerson: Person = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      photo: data.photo ?? undefined,
      type: data.type,
      cadence_tier: data.cadence_tier,
      where_from: data.where_from ?? undefined,
      birthday: data.birthday ?? undefined,
      nudge_interaction_type: data.nudge_interaction_type,
      date_added: data.date_added,
      last_interaction_date: undefined,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
    };

    reset();
    onSave(newPerson);
  }

  const tierColorVal = tierColor(tier);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { height: SHEET_HEIGHT }]}>

          {/* Handle bar row */}
          <View style={styles.handleRow}>
            <View style={styles.handleSpacer} />
            <View style={styles.handle} />
            <View style={styles.handleRight}>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
                <IconSymbol name="xmark" size={14} color={Palette.iconInactive} weight="medium" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Title */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>New Contact</Text>
            </View>

            {/* Name inputs */}
            <View style={styles.nameCard}>
              <TextInput
                style={styles.nameInput}
                placeholder="First name"
                placeholderTextColor={Palette.iconInactive}
                value={firstName}
                onChangeText={setFirstName}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <View style={styles.nameDivider} />
              <TextInput
                style={styles.nameInput}
                placeholder="Last name"
                placeholderTextColor={Palette.iconInactive}
                value={lastName}
                onChangeText={setLastName}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>

            <View style={styles.divider} />

            {/* Detail fields */}
            <View style={styles.detailsCard}>
              <DetailRow label="Type" onPress={editType}>
                <Text style={styles.detailValue}>
                  {type === 'friend' ? 'Friend' : 'Network'}
                </Text>
              </DetailRow>

              <View style={styles.detailDivider} />

              <DetailRow label="Tier" onPress={editTier}>
                <View style={styles.detailTierRow}>
                  <View style={[styles.tierIconBubble, { backgroundColor: tierColorVal + '28' }]}>
                    <IconSymbol name={tierIconName(tier, type)} size={11} color={tierColorVal} />
                  </View>
                  <TierBubble tier={tier} />
                </View>
              </DetailRow>

              <View style={styles.detailDivider} />

              <DetailRow label="Where from" onPress={editWhereFrom}>
                <Text style={[styles.detailValue, !whereFrom && styles.detailEmpty]}>
                  {whereFrom ?? '---'}
                </Text>
              </DetailRow>

              <View style={styles.detailDivider} />

              <DetailRow label="Birthday" onPress={editBirthday}>
                <Text style={[styles.detailValue, !birthday && styles.detailEmpty]}>
                  {birthday ?? '---'}
                </Text>
              </DetailRow>

              <View style={styles.detailDivider} />

              <DetailRow label="Phone" onPress={editPhone}>
                <Text style={[styles.detailValue, !phone && styles.detailEmpty]}>
                  {phone ?? '---'}
                </Text>
              </DetailRow>

              <View style={styles.detailDivider} />

              <DetailRow label="Email" onPress={editEmail}>
                <Text style={[styles.detailValue, !email && styles.detailEmpty]}>
                  {email ?? '---'}
                </Text>
              </DetailRow>

              <View style={styles.detailDivider} />

              <DetailRow label="Nudge via" onPress={editNudge}>
                <View style={styles.detailIconRow}>
                  <IconSymbol name={nudgeIconName(nudge)} size={13} color={Palette.text} />
                  <Text style={styles.detailValue}>{nudgeLabel(nudge)}</Text>
                </View>
              </DetailRow>
            </View>

          </ScrollView>

          {/* Save button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!canSave || saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  sheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
    }),
  },

  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleSpacer: { flex: 1 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.tabBarBorder,
  },
  handleRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  titleRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.4,
  },

  nameCard: {
    marginHorizontal: 24,
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  nameInput: {
    fontSize: 16,
    color: Palette.text,
    paddingVertical: 14,
  },
  nameDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.tabBarBorder,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.tabBarBorder,
    marginHorizontal: 24,
    marginVertical: 16,
  },

  detailsCard: {
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 8,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.tabBarBorder,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
    width: 100,
    flexShrink: 0,
  },
  detailValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  detailValue: {
    fontSize: 14,
    color: Palette.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  detailEmpty: {
    color: Palette.iconInactive,
  },
  detailTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tierBubble: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tierBubbleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tierIconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.tabBarBorder,
  },
  saveBtn: {
    backgroundColor: Palette.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.35,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
