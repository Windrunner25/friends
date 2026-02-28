import React, { useRef, useState } from 'react';
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
import { MOCK_PEOPLE, MOCK_INTERACTIONS } from '@/data/mock';
import { ContactCard } from '@/components/ContactCard';
import type { Person, Interaction } from '@/types';
import { tierColor, tierLabel } from '@/utils/people';

// ─── Types ────────────────────────────────────────────────────────────────────

type Scope = 'both' | 'friends' | 'network';

interface MonthBucket {
  label: string;    // "Mar", "Apr" etc.
  yearLabel: string; // "2025" when year changes, '' otherwise
  count: number;     // total interactions
  unique: number;    // unique people
}

interface LeaderEntry {
  person: Person;
  count: number;
  rank: number;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

const PERSON_TYPE_MAP = new Map(MOCK_PEOPLE.map((p) => [p.id, p.type]));

function scopedInteractions(scope: Scope): Interaction[] {
  if (scope === 'both') return MOCK_INTERACTIONS;
  const targetType = scope === 'friends' ? 'friend' : 'network';
  return MOCK_INTERACTIONS.filter((i) => PERSON_TYPE_MAP.get(i.person_id) === targetType);
}

function scopedPeople(scope: Scope): Person[] {
  if (scope === 'both') return MOCK_PEOPLE;
  const targetType = scope === 'friends' ? 'friend' : 'network';
  return MOCK_PEOPLE.filter((p) => p.type === targetType);
}

/** Returns the ISO date string of the Monday of the week containing `date` */
function weekMonday(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split('T')[0];
}

function computeStreak(interactions: Interaction[]): { current: number; best: number } {
  const weeksWithData = new Set(
    interactions.map((i) => weekMonday(new Date(i.date_of_interaction + 'T00:00:00')))
  );

  // Current streak: walk back from today, week by week
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (weeksWithData.has(weekMonday(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 7);
  }

  // Best streak: find longest run of consecutive weeks in sorted set
  const sorted = [...weeksWithData].sort();
  let best = 0;
  let run = 0;
  let prevMs = 0;
  for (const ws of sorted) {
    const ms = new Date(ws + 'T00:00:00').getTime();
    run = prevMs > 0 && ms - prevMs === 7 * 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prevMs = ms;
  }

  return { current, best: Math.max(current, best) };
}

function buildMonthBuckets(interactions: Interaction[]): MonthBucket[] {
  const today = new Date();
  const buckets: MonthBucket[] = [];
  let prevYear = -1;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const monthInts = interactions.filter((ix) => {
      const id = new Date(ix.date_of_interaction + 'T00:00:00');
      return id.getFullYear() === year && id.getMonth() === month;
    });

    buckets.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      yearLabel: year !== prevYear ? String(year) : '',
      count: monthInts.length,
      unique: new Set(monthInts.map((ix) => ix.person_id)).size,
    });
    prevYear = year;
  }

  return buckets;
}

function buildLeaderboard(interactions: Interaction[], people: Person[]): LeaderEntry[] {
  const countMap = new Map<string, number>();
  for (const i of interactions) {
    countMap.set(i.person_id, (countMap.get(i.person_id) ?? 0) + 1);
  }

  const sorted = people
    .filter((p) => countMap.has(p.id))
    .map((p) => ({ person: p, count: countMap.get(p.id)! }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.person.first_name.localeCompare(b.person.first_name)
    );

  let rank = 1;
  return sorted.map((entry, i) => {
    if (i > 0 && entry.count < sorted[i - 1].count) rank = i + 1;
    return { ...entry, rank };
  });
}

// ─── Bar chart constants ──────────────────────────────────────────────────────

const BAR_MAX_H = 96;  // px — max rendered bar height
const BAR_W = 24;      // px — bar width
const COL_W = 42;      // px — column width (bar + horizontal gap)

// ─── Sub-components ──────────────────────────────────────────────────────────

function TierBubble({ tier }: { tier: Person['cadence_tier'] }) {
  const color = tierColor(tier);
  return (
    <View style={[styles.tierBubble, { backgroundColor: color + '30' }]}>
      <Text style={[styles.tierBubbleText, { color }]}>{tierLabel(tier)}</Text>
    </View>
  );
}

function InitialAvatar({ person, size = 36 }: { person: Person; size?: number }) {
  const color = tierColor(person.cadence_tier);
  const initials = `${person.first_name[0]}${person.last_name[0]}`;
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '30' },
      ]}>
      <Text style={[styles.avatarInitials, { color, fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
}

function BarChart({
  buckets,
  valueKey,
  title,
}: {
  buckets: MonthBucket[];
  valueKey: 'count' | 'unique';
  title: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const values = buckets.map((b) => b[valueKey]);
  const maxVal = Math.max(...values, 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {buckets.map((b, i) => {
          const val = b[valueKey];
          const barH = val > 0 ? Math.max((val / maxVal) * BAR_MAX_H, 6) : 0;
          const isCurrent = i === buckets.length - 1;

          return (
            <View key={i} style={[styles.barCol, { width: COL_W }]}>
              {/* Fixed-height area — bar + value label are bottom-aligned inside it */}
              <View style={styles.barArea}>
                {val > 0 && (
                  <Text style={[styles.barValueLabel, isCurrent && styles.barValueLabelCurrent]}>
                    {val}
                  </Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: val > 0 ? barH : 2,
                      width: BAR_W,
                      backgroundColor: val > 0
                        ? (isCurrent ? Palette.accent : Palette.accent + '65')
                        : Palette.tabBarBorder,
                    },
                  ]}
                />
              </View>
              {/* Labels below the bar */}
              <Text style={[styles.barMonthLabel, isCurrent && styles.barMonthLabelCurrent]}>
                {b.label}
              </Text>
              <Text style={styles.barYearLabel}>{b.yearLabel}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const [scope, setScope] = useState<Scope>('both');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const interactions = scopedInteractions(scope);
  const people = scopedPeople(scope);
  const streak = computeStreak(interactions);
  const buckets = buildMonthBuckets(interactions);
  const leaderboard = buildLeaderboard(interactions, people);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.headerTitle}>Stats</Text>

        {/* Scope filter pills */}
        <View style={styles.scopeRow}>
          {(['both', 'friends', 'network'] as Scope[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.scopePill, scope === s && styles.scopePillActive]}
              onPress={() => setScope(s)}
              activeOpacity={0.7}>
              <Text style={[styles.scopeLabel, scope === s && styles.scopeLabelActive]}>
                {s === 'both' ? 'Both' : s === 'friends' ? 'Friends' : 'Network'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top stat tiles */}
        <View style={styles.tilesRow}>
          {/* Streak tile */}
          <View style={[styles.tile, styles.tileHalf]}>
            <View style={styles.tileTopRow}>
              <Text style={styles.tileBigNumber}>{streak.current}</Text>
              <IconSymbol name="flame.fill" size={22} color={Palette.accent} />
            </View>
            <Text style={styles.tileLabel}>week streak</Text>
            <Text style={styles.tileSecondary}>
              Best: {streak.best} week{streak.best !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Total interactions tile */}
          <View style={[styles.tile, styles.tileHalf]}>
            <Text style={styles.tileBigNumber}>{interactions.length}</Text>
            <Text style={styles.tileLabel}>interactions</Text>
          </View>
        </View>

        {/* Bar charts */}
        <BarChart buckets={buckets} valueKey="count" title="Interactions" />
        <BarChart buckets={buckets} valueKey="unique" title="Unique People" />

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.leaderSection}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <View style={styles.leaderList}>
              {leaderboard.map((entry) => (
                <TouchableOpacity
                  key={entry.person.id}
                  style={styles.leaderRow}
                  onPress={() => setSelectedPerson(entry.person)}
                  activeOpacity={0.7}>
                  <Text style={styles.leaderRank}>#{entry.rank}</Text>
                  <InitialAvatar person={entry.person} size={36} />
                  <View style={styles.leaderMid}>
                    <Text style={styles.leaderName} numberOfLines={1}>
                      {entry.person.first_name} {entry.person.last_name}
                    </Text>
                    <TierBubble tier={entry.person.cadence_tier} />
                  </View>
                  <Text style={styles.leaderCount}>
                    {entry.count} {entry.count === 1 ? 'interaction' : 'interactions'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      <ContactCard
        person={selectedPerson}
        visible={selectedPerson !== null}
        onClose={() => setSelectedPerson(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 20,
  },

  // Header
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.5,
    paddingTop: 8,
  },

  // Scope pills
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.cardSurface,
    borderWidth: 1,
    borderColor: Palette.tabBarBorder,
  },
  scopePillActive: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  scopeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.iconInactive,
  },
  scopeLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Stat tiles
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 18,
    padding: 18,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
    }),
  },
  tileHalf: { flex: 1 },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileBigNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -1,
    lineHeight: 44,
  },
  tileLabel: {
    fontSize: 13,
    color: Palette.iconInactive,
    fontWeight: '500',
  },
  tileSecondary: {
    fontSize: 12,
    color: Palette.iconInactive,
    marginTop: 2,
  },

  // Charts
  chartCard: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 18,
    padding: 18,
    paddingBottom: 10,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
    }),
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  chartScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 4,
  },

  // Individual bar columns
  barCol: {
    alignItems: 'center',
  },
  barArea: {
    height: BAR_MAX_H + 20,   // fixed height: bar headroom + value label space
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderRadius: 5,
  },
  barValueLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Palette.iconInactive,
    marginBottom: 3,
  },
  barValueLabelCurrent: {
    color: Palette.accent,
  },
  barMonthLabel: {
    fontSize: 10,
    color: Palette.iconInactive,
    marginTop: 6,
    fontWeight: '500',
  },
  barMonthLabelCurrent: {
    color: Palette.text,
    fontWeight: '600',
  },
  barYearLabel: {
    fontSize: 9,
    color: Palette.iconInactive,
    marginTop: 1,
    lineHeight: 12,
  },

  // Leaderboard
  leaderSection: { gap: 12 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  leaderList: { gap: 8 },
  leaderRow: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  leaderRank: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.iconInactive,
    width: 24,
    textAlign: 'center',
    flexShrink: 0,
  },
  leaderMid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    overflow: 'hidden',
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '500',
    color: Palette.text,
    flexShrink: 1,
  },
  leaderCount: {
    fontSize: 12,
    color: Palette.iconInactive,
    flexShrink: 0,
  },

  // Shared
  tierBubble: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  tierBubbleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontWeight: '600',
  },
});
