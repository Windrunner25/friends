import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { ContactCard } from '@/components/ContactCard';
import { usePeople } from '@/hooks/use-people';
import type { Person } from '@/types';
import { tierColor, tierLabel, tierIconName, relativeTime } from '@/utils/people';

// ─── Types ────────────────────────────────────────────────────────────────────

type FriendTier = 'close_friend' | 'keep_warm' | 'dont_lose_touch';
type NetworkTier = 'active' | 'keep_warm' | 'dont_lose_touch';

const FRIEND_TIERS: FriendTier[] = ['close_friend', 'keep_warm', 'dont_lose_touch'];
const NETWORK_TIERS: NetworkTier[] = ['active', 'keep_warm', 'dont_lose_touch'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function TierBubble({ tier }: { tier: Person['cadence_tier'] }) {
  const color = tierColor(tier);
  return (
    <View style={[styles.tierBubble, { backgroundColor: color + '30' }]}>
      <Text style={[styles.tierBubbleText, { color }]}>{tierLabel(tier)}</Text>
    </View>
  );
}

function PersonRow({ person, onPress }: { person: Person; onPress: () => void }) {
  const color = tierColor(person.cadence_tier);
  return (
    <TouchableOpacity style={styles.personRow} onPress={onPress} activeOpacity={0.7}>
      {/* Tier icon bubble */}
      <View style={[styles.tierIconBubble, { backgroundColor: color + '28' }]}>
        <IconSymbol name={tierIconName(person.cadence_tier, person.type) as any} size={13} color={color} />
      </View>

      {/* Name + tier bubble */}
      <View style={styles.personRowMid}>
        <Text style={styles.personName} numberOfLines={1}>
          {person.first_name} {person.last_name}
        </Text>
        <TierBubble tier={person.cadence_tier} />
      </View>

      {/* Last interaction date */}
      <Text style={styles.personTime}>{relativeTime(person.last_interaction_date)}</Text>
    </TouchableOpacity>
  );
}

// ─── People Page (one per tab) ───────────────────────────────────────────────

function PeoplePage({
  type,
  people,
  pageWidth,
  pageHeight,
  onPersonPress,
}: {
  type: 'friend' | 'network';
  people: Person[];
  pageWidth: number;
  pageHeight: number;
  onPersonPress: (p: Person) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const tiers = type === 'friend' ? FRIEND_TIERS : NETWORK_TIERS;
  const allPeople = people;

  // Tier filter: empty set = show all
  const tierFiltered =
    activeFilters.size === 0
      ? allPeople
      : allPeople.filter((p) => activeFilters.has(p.cadence_tier));

  // Search filter
  const filtered =
    searchQuery.length >= 1
      ? tierFiltered.filter((p) =>
          `${p.first_name} ${p.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : tierFiltered;

  // Sort alphabetically
  const sorted = [...filtered].sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  function toggleFilter(tier: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  return (
    <View style={{ width: pageWidth, height: pageHeight }}>

      {/* Tier filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}>
        {tiers.map((tier) => {
          const active = activeFilters.has(tier);
          const color = tierColor(tier);
          return (
            <TouchableOpacity
              key={tier}
              style={[
                styles.filterPill,
                active && { backgroundColor: color + '25', borderColor: color + '70' },
              ]}
              onPress={() => toggleFilter(tier)}
              activeOpacity={0.7}>
              <Text style={[styles.filterPillText, active && { color }]}>
                {tierLabel(tier)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={15} color={Palette.iconInactive} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Palette.iconInactive}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={15} color={Palette.iconInactive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Person list */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No people found.</Text>
          </View>
        ) : (
          sorted.map((p) => (
            <PersonRow key={p.id} person={p} onPress={() => onPersonPress(p)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PeopleScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { people, loading, updatePerson } = usePeople();
  const friends = people.filter((p) => p.type === 'friend');
  const network = people.filter((p) => p.type === 'network');
  const [activeTab, setActiveTab] = useState<'friends' | 'network'>('friends');
  const [pagerHeight, setPagerHeight] = useState(SCREEN_HEIGHT);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const pagerRef = useRef<ScrollView>(null);

  function handleTabPress(tab: 'friends' | 'network') {
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: tab === 'network' ? SCREEN_WIDTH : 0, animated: true });
  }

  function handlePageChange(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveTab(page === 0 ? 'friends' : 'network');
  }

  function handleAddPerson() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Import from Contacts', 'Add Manually'],
        cancelButtonIndex: 0,
      },
      (idx) => {
        if (idx === 1) {
          Alert.alert('Coming soon', 'Contact import will be available in a future update.');
        } else if (idx === 2) {
          Alert.alert('Coming soon', 'Manual add will be available in a future update.');
        }
      }
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>People</Text>
      </View>

      {/* Friends / Network tab switcher */}
      <View style={styles.tabSwitcher}>
        {(['friends', 'network'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'friends' ? 'Friends' : 'Network'}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Pager */}
      <View style={{ flex: 1 }} onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.accent} />
          </View>
        ) : (
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePageChange}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled">
            <PeoplePage
              type="friend"
              people={friends}
              pageWidth={SCREEN_WIDTH}
              pageHeight={pagerHeight}
              onPersonPress={setSelectedPerson}
            />
            <PeoplePage
              type="network"
              people={network}
              pageWidth={SCREEN_WIDTH}
              pageHeight={pagerHeight}
              onPersonPress={setSelectedPerson}
            />
          </ScrollView>
        )}
      </View>

      {/* Floating + button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPerson} activeOpacity={0.85}>
        <IconSymbol name="plus" size={22} color="#fff" weight="medium" />
      </TouchableOpacity>

      {/* Contact card */}
      <ContactCard
        person={selectedPerson}
        visible={selectedPerson !== null}
        onClose={() => setSelectedPerson(null)}
        onPersonChanged={(id, changes) => {
          updatePerson(id, changes);
          setSelectedPerson((prev) => (prev?.id === id ? { ...prev, ...changes } : prev));
        }}
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

  // Header
  header: {
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

  // Tab switcher (same pattern as Home)
  tabSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.tabBarBorder,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Palette.iconInactive,
    marginBottom: 6,
  },
  tabLabelActive: {
    color: Palette.text,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.accent,
  },

  // Filter pills
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Palette.cardSurface,
    borderWidth: 1,
    borderColor: Palette.tabBarBorder,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.iconInactive,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
  },

  // List
  listScroll: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 8,
  },

  // Person row
  personRow: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  tierIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  personRowMid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    overflow: 'hidden',
  },
  personName: {
    fontSize: 15,
    fontWeight: '500',
    color: Palette.text,
    flexShrink: 1,
  },
  personTime: {
    fontSize: 12,
    color: Palette.iconInactive,
    flexShrink: 0,
  },

  // Tier bubble
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

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Palette.iconInactive,
  },

  // Floating + button
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
    }),
  },
});
