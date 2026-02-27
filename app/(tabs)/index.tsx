import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { MOCK_PEOPLE, MOCK_UPCOMING } from '@/data/mock';
import type { Person, UpcomingReminder } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function tierDotColor(tier: Person['cadence_tier']): string {
  if (tier === 'close_friend' || tier === 'active') return Palette.accent;
  if (tier === 'keep_warm') return Palette.midTier;
  return Palette.lightTier;
}

function daysAgoLabel(days_overdue?: number): string {
  if (days_overdue === undefined) return 'Never';
  if (days_overdue === 0) return 'Today';
  if (days_overdue > 0) return `${days_overdue}d overdue`;
  return `${Math.abs(days_overdue)}d ago`;
}

function upcomingDaysLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TierDot({ tier }: { tier: Person['cadence_tier'] }) {
  return <View style={[styles.tierDot, { backgroundColor: tierDotColor(tier) }]} />;
}

function UpNextCard({ person }: { person: Person }) {
  return (
    <View style={styles.upNextCard}>
      <View style={styles.upNextRow}>
        <TierDot tier={person.cadence_tier} />
        <Text style={styles.upNextName}>
          {person.first_name} {person.last_name}
        </Text>
        <Text style={styles.upNextOverdue}>{daysAgoLabel(person.days_overdue)}</Text>
      </View>
      {person.last_interaction_note ? (
        <Text style={styles.upNextNote} numberOfLines={2}>
          {person.last_interaction_note}
        </Text>
      ) : null}
    </View>
  );
}

function UpcomingItem({ item }: { item: UpcomingReminder }) {
  const icon = item.type === 'birthday' ? 'gift' : 'calendar';
  return (
    <View style={styles.upcomingItem}>
      <IconSymbol name={icon} size={15} color={Palette.iconInactive} />
      <Text style={styles.upcomingLabel}>{item.label}</Text>
      <Text style={styles.upcomingDate}>{upcomingDaysLabel(item.date)}</Text>
    </View>
  );
}

function PersonRow({ person }: { person: Person }) {
  return (
    <View style={styles.personRow}>
      <TierDot tier={person.cadence_tier} />
      <Text style={styles.personName}>
        {person.first_name} {person.last_name}
      </Text>
      <Text style={styles.personDate}>{daysAgoLabel(person.days_overdue)}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'network'>('friends');

  const people = MOCK_PEOPLE.filter((p) => p.type === (activeTab === 'friends' ? 'friend' : 'network'));
  const sorted = [...people].sort((a, b) => (b.days_overdue ?? -999) - (a.days_overdue ?? -999));
  const upNext = sorted.filter((p) => (p.days_overdue ?? 0) > 0).slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity hitSlop={12}>
          <IconSymbol name="gearshape.fill" size={22} color={Palette.iconInactive} />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
          onPress={() => setActiveTab('friends')}>
          <Text style={[styles.tabLabel, activeTab === 'friends' && styles.tabLabelActive]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'network' && styles.tabButtonActive]}
          onPress={() => setActiveTab('network')}>
          <Text style={[styles.tabLabel, activeTab === 'network' && styles.tabLabelActive]}>
            Network
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Up Next */}
        {upNext.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>UP NEXT</Text>
            <View style={styles.upNextList}>
              {upNext.map((p) => (
                <UpNextCard key={p.id} person={p} />
              ))}
            </View>
          </View>
        )}

        {/* Upcoming */}
        {MOCK_UPCOMING.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>UPCOMING</Text>
            <View style={styles.upcomingList}>
              {MOCK_UPCOMING.map((item) => (
                <UpcomingItem key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}

        {/* Everyone */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EVERYONE</Text>
          <View style={styles.roster}>
            {sorted.map((p, i) => (
              <React.Fragment key={p.id}>
                <PersonRow person={p} />
                {i < sorted.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.5,
  },

  // Tab switcher
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Palette.cardSurface,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Palette.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
    }),
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.iconInactive,
  },
  tabLabelActive: {
    color: Palette.text,
    fontWeight: '600',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 28,
  },

  // Section
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Palette.iconInactive,
  },

  // Up Next cards
  upNextList: { gap: 10 },
  upNextCard: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upNextName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  upNextOverdue: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.accent,
  },
  upNextNote: {
    fontSize: 13,
    color: Palette.iconInactive,
    lineHeight: 18,
    paddingLeft: 18,
  },

  // Upcoming
  upcomingList: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  upcomingLabel: {
    flex: 1,
    fontSize: 14,
    color: Palette.text,
  },
  upcomingDate: {
    fontSize: 12,
    color: Palette.iconInactive,
  },

  // Roster
  roster: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  personName: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
  },
  personDate: {
    fontSize: 12,
    color: Palette.iconInactive,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.tabBarBorder,
    marginLeft: 14 + 10 + 10, // indent past dot + gap
  },

  // Shared
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
