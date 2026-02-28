import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  PanResponder,
  Animated,
  Linking,
  Alert,
  ActionSheetIOS,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { MOCK_INTERACTIONS } from '@/data/mock';
import type { Person, Interaction, InteractionType } from '@/types';
import {
  tierColor,
  tierLabel,
  tierIconName,
  nudgeIconName,
  nudgeLabel,
  relativeTime,
  formatLongDate,
  formatShortDate,
} from '@/utils/people';

// ─── Static data ─────────────────────────────────────────────────────────────

const CONVERSATION_STARTERS = [
  "It's been a while — would love to catch up soon.",
  "Been thinking about you lately, hope all is well.",
  "Would love to hear what you've been up to.",
  "Long overdue for a proper catch up.",
  "Hope life is treating you well — let's reconnect soon.",
  "Been too long, would love to find a time to chat.",
  "Randomly thought of you today — hope you're doing great.",
  "Would love to hear what's new with you.",
  "It's been a minute — let's catch up soon.",
  "Thinking of you — hope everything is going well.",
];

function pickStarter(): string {
  return CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InitialAvatar({ person, size = 64 }: { person: Person; size?: number }) {
  const color = tierColor(person.cadence_tier);
  const initials = `${person.first_name[0]}${person.last_name[0]}`;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '30' }]}>
      <Text style={[styles.avatarInitials, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.actionBtnCircle}>
        <IconSymbol name={icon} size={17} color="#fff" weight="medium" />
      </View>
      <Text style={styles.actionBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

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

function HistoryEntry({ interaction, isLast }: { interaction: Interaction; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasNotes = !!interaction.notes;

  return (
    <View style={styles.historyEntry}>
      <View style={styles.historySpine}>
        <View style={styles.historyDot} />
        {!isLast && <View style={styles.historyLine} />}
      </View>
      <View style={[styles.historyContent, !isLast && styles.historyContentSpacing]}>
        <Text style={styles.historyDate}>{formatShortDate(interaction.date_of_interaction)}</Text>
        <View style={styles.historyTypeRow}>
          <IconSymbol name={nudgeIconName(interaction.type)} size={12} color={Palette.iconInactive} />
          <Text style={styles.historyType}>{nudgeLabel(interaction.type)}</Text>
        </View>
        {hasNotes && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.8}
            style={styles.historyNotesBox}>
            <Text style={styles.historyNotes} numberOfLines={expanded ? undefined : 2}>
              {interaction.notes}
            </Text>
            {!expanded && (interaction.notes?.length ?? 0) > 80 && (
              <Text style={styles.historyExpandHint}>tap to expand</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Inner content (non-null person) ─────────────────────────────────────────

function ContactCardContent({ person, onClose }: { person: Person; onClose: () => void }) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const SHEET_HEIGHT = SCREEN_HEIGHT - 88;

  const [starter, setStarter] = useState(pickStarter);
  const [editedType, setEditedType] = useState<Person['type']>(person.type);
  const [editedTier, setEditedTier] = useState<Person['cadence_tier']>(person.cadence_tier);
  const [editedWhereFrom, setEditedWhereFrom] = useState<string | undefined>(person.where_from);
  const [editedBirthday, setEditedBirthday] = useState<string | undefined>(person.birthday);
  const [editedNudge, setEditedNudge] = useState<InteractionType>(person.nudge_interaction_type);

  const dragY = useRef(new Animated.Value(0)).current;
  // Tracks ScrollView position so we only intercept downward drags at the top
  const scrollYRef = useRef(0);

  useEffect(() => {
    setStarter(pickStarter());
    dragY.setValue(0);
    setEditedType(person.type);
    setEditedTier(person.cadence_tier);
    setEditedWhereFrom(person.where_from);
    setEditedBirthday(person.birthday);
    setEditedNudge(person.nudge_interaction_type);
  }, [person.id]);

  // PanResponder on the full sheet.
  // With bounces={false} on the ScrollView, a downward drag at scrollY=0 is
  // not consumed by the ScrollView, so we can cleanly intercept it here.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        scrollYRef.current <= 0 && dy > 8 && Math.abs(dy) > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) dragY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 90 || vy > 1.5) {
          onClose();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const interactions = MOCK_INTERACTIONS
    .filter((i) => i.person_id === person.id)
    .sort((a, b) => new Date(b.date_of_interaction).getTime() - new Date(a.date_of_interaction).getTime());

  const tierColorVal = tierColor(editedTier);

  function openMessages() { Linking.openURL('sms:'); }
  function openCall() { Linking.openURL('tel:'); }
  function openFaceTime() { Linking.openURL('facetime:'); }
  function openMail() { Linking.openURL('mailto:'); }

  function editType() {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', 'Friend', 'Network'], cancelButtonIndex: 0 },
      (idx) => {
        if (idx === 1) setEditedType('friend');
        if (idx === 2) setEditedType('network');
      }
    );
  }

  function editTier() {
    const isFriend = editedType === 'friend';
    const labels = isFriend
      ? ['Close Friend', 'Keep Warm', "Don't Lose Touch"]
      : ['Active', 'Keep Warm', "Don't Lose Touch"];
    const values: Person['cadence_tier'][] = isFriend
      ? ['close_friend', 'keep_warm', 'dont_lose_touch']
      : ['active', 'keep_warm', 'dont_lose_touch'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', ...labels], cancelButtonIndex: 0 },
      (idx) => { if (idx > 0) setEditedTier(values[idx - 1]); }
    );
  }

  function editWhereFrom() {
    Alert.prompt(
      'Where you know them from',
      '',
      (text) => setEditedWhereFrom(text.trim() || undefined),
      'plain-text',
      editedWhereFrom ?? '',
    );
  }

  function editBirthday() {
    Alert.prompt(
      'Birthday',
      'Format: YYYY-MM-DD',
      (text) => setEditedBirthday(text.trim() || undefined),
      'plain-text',
      editedBirthday ?? '',
    );
  }

  function editNudge() {
    const labels = ['Call', 'FaceTime', 'Text', 'Email', 'In Person'];
    const values: InteractionType[] = ['call', 'facetime', 'text', 'email', 'in_person'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Cancel', ...labels], cancelButtonIndex: 0 },
      (idx) => { if (idx > 0) setEditedNudge(values[idx - 1]); }
    );
  }

  return (
    <Animated.View
      style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY: dragY }] }]}
      {...panResponder.panHandlers}>

      {/* Handle bar + close button — flex row so X is never clipped */}
      <View style={styles.handleRow}>
        <View style={styles.handleSpacer} />
        <View style={styles.handle} />
        <View style={styles.handleRight}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <IconSymbol name="xmark" size={14} color={Palette.iconInactive} weight="medium" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <InitialAvatar person={person} size={64} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{person.first_name} {person.last_name}</Text>
            {person.where_from && (
              <Text style={styles.headerWhere}>{person.where_from}</Text>
            )}
            <View style={styles.actionRow}>
              <ActionButton icon="message.fill" label="Text" onPress={openMessages} />
              <ActionButton icon="phone.fill" label="Call" onPress={openCall} />
              <ActionButton icon="video.fill" label="FaceTime" onPress={openFaceTime} />
              <ActionButton icon="envelope.fill" label="Mail" onPress={openMail} />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Details ── */}
        <View style={styles.detailsCard}>
          <DetailRow label="Type" onPress={editType}>
            <Text style={styles.detailValue}>
              {editedType === 'friend' ? 'Friend' : 'Network'}
            </Text>
          </DetailRow>

          <View style={styles.detailDivider} />

          <DetailRow label="Tier" onPress={editTier}>
            <View style={styles.detailTierRow}>
              <View style={[styles.tierIconBubble, { backgroundColor: tierColorVal + '28' }]}>
                <IconSymbol name={tierIconName(editedTier, editedType)} size={11} color={tierColorVal} />
              </View>
              <TierBubble tier={editedTier} />
            </View>
          </DetailRow>

          <View style={styles.detailDivider} />

          <DetailRow label="Where from" onPress={editWhereFrom}>
            <Text style={[styles.detailValue, !editedWhereFrom && styles.detailEmpty]}>
              {editedWhereFrom ?? '---'}
            </Text>
          </DetailRow>

          <View style={styles.detailDivider} />

          <DetailRow label="Birthday" onPress={editBirthday}>
            <Text style={[styles.detailValue, !editedBirthday && styles.detailEmpty]}>
              {editedBirthday ? formatLongDate(editedBirthday) : '---'}
            </Text>
          </DetailRow>

          <View style={styles.detailDivider} />

          <DetailRow label="Nudge via" onPress={editNudge}>
            <View style={styles.detailIconRow}>
              <IconSymbol name={nudgeIconName(editedNudge)} size={13} color={Palette.text} />
              <Text style={styles.detailValue}>{nudgeLabel(editedNudge)}</Text>
            </View>
          </DetailRow>

          <View style={styles.detailDivider} />

          <DetailRow label="Added">
            <Text style={styles.detailValue}>{formatLongDate(person.date_added)}</Text>
          </DetailRow>

          <View style={styles.detailDivider} />

          <DetailRow label="Last contact">
            <Text style={[styles.detailValue, !person.last_interaction_date && styles.detailEmpty]}>
              {person.last_interaction_date
                ? `${formatShortDate(person.last_interaction_date)} · ${relativeTime(person.last_interaction_date)}`
                : '---'}
            </Text>
          </DetailRow>
        </View>

        <View style={styles.divider} />

        {/* ── Conversation Starter ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to say</Text>
          <View style={styles.starterCard}>
            <Text style={styles.starterText}>"{starter}"</Text>
            <TouchableOpacity
              style={styles.starterRefreshRow}
              onPress={() => setStarter(pickStarter())}
              activeOpacity={0.7}>
              <IconSymbol name="arrow.clockwise" size={13} color={Palette.accent} />
              <Text style={styles.starterRefreshLabel}>Another one</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Interaction History ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>

          {/* Log interaction placeholder */}
          <TouchableOpacity
            style={styles.logPlaceholder}
            onPress={() => Alert.alert('Coming soon', 'Interaction logging is coming in a future update.')}
            activeOpacity={0.65}>
            <IconSymbol name="plus.circle" size={16} color={Palette.accent} />
            <Text style={styles.logPlaceholderText}>Log an interaction...</Text>
          </TouchableOpacity>

          {interactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No interactions logged yet.</Text>
              <Text style={styles.emptyHistorySubtext}>
                When you log a conversation, it'll show up here.
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {interactions.map((interaction, i) => (
                <HistoryEntry
                  key={interaction.id}
                  interaction={interaction}
                  isLast={i === interactions.length - 1}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  person: Person | null;
  visible: boolean;
  onClose: () => void;
}

export function ContactCard({ person, visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop — tapping closes */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        {person && <ContactCardContent person={person} onClose={onClose} />}
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

  // Handle bar row — flex layout so X is always visible, never clipped
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleSpacer: {
    flex: 1,
  },
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
  scrollContent: { paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  headerWhere: {
    fontSize: 13,
    color: Palette.iconInactive,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 10,
    color: Palette.iconInactive,
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.tabBarBorder,
    marginHorizontal: 24,
    marginVertical: 4,
  },

  // Details
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

  // Sections
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.2,
  },

  // Conversation starter
  starterCard: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  starterText: {
    fontSize: 15,
    color: Palette.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  starterRefreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  starterRefreshLabel: {
    fontSize: 13,
    color: Palette.accent,
    fontWeight: '500',
  },

  // Log placeholder
  logPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Palette.tabBarBorder,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  logPlaceholderText: {
    fontSize: 14,
    color: Palette.iconInactive,
  },

  // History timeline
  emptyHistory: {
    gap: 4,
    paddingVertical: 8,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: Palette.text,
    fontWeight: '500',
  },
  emptyHistorySubtext: {
    fontSize: 13,
    color: Palette.iconInactive,
  },
  timeline: {
    gap: 0,
  },
  historyEntry: {
    flexDirection: 'row',
    gap: 12,
  },
  historySpine: {
    width: 16,
    alignItems: 'center',
    paddingTop: 4,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.accent,
    flexShrink: 0,
  },
  historyLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Palette.tabBarBorder,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  historyContentSpacing: {
    paddingBottom: 20,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },
  historyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyType: {
    fontSize: 12,
    color: Palette.iconInactive,
  },
  historyNotesBox: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  historyNotes: {
    fontSize: 13,
    color: Palette.text,
    lineHeight: 18,
  },
  historyExpandHint: {
    fontSize: 11,
    color: Palette.accent,
  },
});
