import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { MOCK_PEOPLE, MOCK_MOMENTS, MockMoment } from '@/data/mock';
import { ContactCard } from '@/components/ContactCard';
import type { Person } from '@/types';
import {
  tierColor,
  tierLabel,
  tierIconName,
  nudgeIconName,
  relativeTime,
  futureRelativeDate,
  birthdayRelativeDate,
  upcomingBirthdays,
} from '@/utils/people';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TODAY = new Date();

function formatHeaderDate(): string {
  const weekday = TODAY.toLocaleDateString('en-US', { weekday: 'long' });
  const month = TODAY.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${month} ${TODAY.getDate()}`;
}

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
  const accentColor = tierColor(person.cadence_tier);
  return (
    <TouchableOpacity
      style={[styles.personRow, { borderLeftColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.personRowLeft}>
        <Text style={styles.personName}>{person.first_name} {person.last_name}</Text>
        <TierBubble tier={person.cadence_tier} />
      </View>
      <View style={styles.personRowRight}>
        <IconSymbol
          name={nudgeIconName(person.nudge_interaction_type)}
          size={13}
          color={Palette.iconInactive}
        />
        <Text style={styles.personTime}>{relativeTime(person.last_interaction_date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function InitialAvatar({ person, size = 44 }: { person: Person; size?: number }) {
  const color = tierColor(person.cadence_tier);
  const initials = `${person.first_name[0]}${person.last_name[0]}`;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '30' }]}>
      <Text style={[styles.avatarInitials, { color }]}>{initials}</Text>
    </View>
  );
}

function BirthdayTile({ person, onPress }: { person: Person; onPress: () => void }) {
  const color = tierColor(person.cadence_tier);
  return (
    <TouchableOpacity style={styles.birthdayTile} onPress={onPress} activeOpacity={0.7}>
      <InitialAvatar person={person} size={44} />
      <Text style={styles.birthdayName}>{person.first_name}</Text>
      <Text style={styles.birthdayDate}>{birthdayRelativeDate(person.birthday!)}</Text>
      <View style={[styles.tierIconBubble, { backgroundColor: color + '30' }]}>
        <IconSymbol name={tierIconName(person.cadence_tier, person.type)} size={11} color={color} />
      </View>
    </TouchableOpacity>
  );
}

function MomentsTile({ moment, onPress }: { moment: MockMoment; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.momentsTile} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.momentsIconContainer}>
        <IconSymbol name={moment.icon} size={20} color={Palette.accent} />
      </View>
      <Text style={styles.momentsLabel}>{moment.label}</Text>
      <Text style={styles.momentsDate}>{futureRelativeDate(moment.date)}</Text>
      <Text style={styles.momentsStarter} numberOfLines={2}>{moment.starter}</Text>
    </TouchableOpacity>
  );
}

function MomentsModal({
  visible,
  moment,
  contacts,
  onClose,
  onPersonPress,
}: {
  visible: boolean;
  moment: MockMoment | null;
  contacts: Person[];
  onClose: () => void;
  onPersonPress: (p: Person) => void;
}) {
  if (!moment) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalIconRow}>
          <View style={styles.modalIconBubble}>
            <IconSymbol name={moment.icon} size={22} color={Palette.accent} />
          </View>
          <View>
            <Text style={styles.modalTitle}>{moment.label}</Text>
            <Text style={styles.modalSubtitle}>{futureRelativeDate(moment.date)}</Text>
          </View>
        </View>
        <Text style={styles.modalStarter}>{moment.starter}</Text>
        {contacts.length > 0 && (
          <>
            <Text style={styles.modalContactsLabel}>Who to reach out to</Text>
            <View style={styles.modalRoster}>
              {contacts.map((p) => (
                <PersonRow key={p.id} person={p} onPress={() => { onClose(); onPersonPress(p); }} />
              ))}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function FriendsPage({
  pageWidth,
  pageHeight,
  onPersonPress,
}: {
  pageWidth: number;
  pageHeight: number;
  onPersonPress: (p: Person) => void;
}) {
  const people = MOCK_PEOPLE.filter((p) => p.type === 'friend');
  const sorted = [...people].sort((a, b) => (b.days_overdue ?? -999) - (a.days_overdue ?? -999));
  const upNext = sorted.filter((p) => (p.days_overdue ?? -1) >= 0).slice(0, 3);
  const upNextIds = new Set(upNext.map((p) => p.id));
  const moreRoster = sorted.filter((p) => !upNextIds.has(p.id));
  const birthdays = upcomingBirthdays(people);

  return (
    <ScrollView
      style={{ width: pageWidth, height: pageHeight }}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}>

      {upNext.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Up Next</Text>
          <View style={styles.rosterList}>
            {upNext.map((p) => (
              <PersonRow key={p.id} person={p} onPress={() => onPersonPress(p)} />
            ))}
          </View>
        </View>
      )}

      {birthdays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Upcoming</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}>
            {birthdays.map((p) => (
              <BirthdayTile key={p.id} person={p} onPress={() => onPersonPress(p)} />
            ))}
          </ScrollView>
        </View>
      )}

      {moreRoster.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>More!</Text>
          <View style={styles.rosterList}>
            {moreRoster.map((p) => (
              <PersonRow key={p.id} person={p} onPress={() => onPersonPress(p)} />
            ))}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

function NetworkPage({
  pageWidth,
  pageHeight,
  onPersonPress,
}: {
  pageWidth: number;
  pageHeight: number;
  onPersonPress: (p: Person) => void;
}) {
  const [selectedMoment, setSelectedMoment] = useState<MockMoment | null>(null);

  const people = MOCK_PEOPLE.filter((p) => p.type === 'network');
  const sorted = [...people].sort((a, b) => (b.days_overdue ?? -999) - (a.days_overdue ?? -999));
  const upNext = sorted.filter((p) => (p.days_overdue ?? -1) >= 0).slice(0, 3);
  const upNextIds = new Set(upNext.map((p) => p.id));
  const moreRoster = sorted.filter((p) => !upNextIds.has(p.id));
  const birthdays = upcomingBirthdays(people);
  const networkDue = sorted.filter((p) => (p.days_overdue ?? -1) >= 0);

  const hasUpcoming = birthdays.length > 0 || MOCK_MOMENTS.length > 0;

  return (
    <>
      <ScrollView
        style={{ width: pageWidth, height: pageHeight }}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}>

        {upNext.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Up Next</Text>
            <View style={styles.rosterList}>
              {upNext.map((p) => (
                <PersonRow key={p.id} person={p} onPress={() => onPersonPress(p)} />
              ))}
            </View>
          </View>
        )}

        {hasUpcoming && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Upcoming</Text>

            {birthdays.length > 0 && (
              <View style={styles.upcomingRow}>
                <Text style={styles.upcomingRowLabel}>Birthdays</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}>
                  {birthdays.map((p) => (
                    <BirthdayTile key={p.id} person={p} onPress={() => onPersonPress(p)} />
                  ))}
                </ScrollView>
              </View>
            )}

            {MOCK_MOMENTS.length > 0 && (
              <View style={styles.upcomingRow}>
                <Text style={styles.upcomingRowLabel}>Moments</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}>
                  {MOCK_MOMENTS.map((m) => (
                    <MomentsTile key={m.id} moment={m} onPress={() => setSelectedMoment(m)} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {moreRoster.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>More!</Text>
            <View style={styles.rosterList}>
              {moreRoster.map((p) => (
                <PersonRow key={p.id} person={p} onPress={() => onPersonPress(p)} />
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      <MomentsModal
        visible={selectedMoment !== null}
        moment={selectedMoment}
        contacts={networkDue}
        onClose={() => setSelectedMoment(null)}
        onPersonPress={onPersonPress}
      />
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <View style={styles.logoPlaceholder} />
        </View>
        <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <TouchableOpacity hitSlop={12}>
            <IconSymbol name="gearshape.fill" size={20} color={Palette.iconInactive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab switcher — centered, underline style */}
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
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}>
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePageChange}
          scrollEventThrottle={16}
          style={{ flex: 1 }}>
          <FriendsPage
            pageWidth={SCREEN_WIDTH}
            pageHeight={pagerHeight}
            onPersonPress={setSelectedPerson}
          />
          <NetworkPage
            pageWidth={SCREEN_WIDTH}
            pageHeight={pagerHeight}
            onPersonPress={setSelectedPerson}
          />
        </ScrollView>
      </View>

      {/* Contact Card */}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerSide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerDate: {
    flex: 2,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '300',
    color: Palette.text,
    letterSpacing: 0.1,
  },
  logoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Palette.cardSurface,
    borderWidth: 1,
    borderColor: Palette.tabBarBorder,
  },

  // Tab switcher
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

  // Page content
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 28,
  },

  // Section
  section: { gap: 12 },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.2,
  },

  // Roster list
  rosterList: {
    gap: 8,
  },
  personRow: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  personRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  personRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
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

  // Upcoming rows
  upcomingRow: {
    gap: 8,
  },
  upcomingRowLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.iconInactive,
    letterSpacing: 0.3,
  },

  // Horizontal scroll
  horizontalScroll: {
    gap: 10,
    paddingRight: 4,
  },

  // Birthday tiles
  birthdayTile: {
    width: 96,
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  birthdayName: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
  },
  birthdayDate: {
    fontSize: 11,
    color: Palette.iconInactive,
    textAlign: 'center',
  },
  tierIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Moments tiles
  momentsTile: {
    width: 156,
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    padding: 14,
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  momentsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  momentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },
  momentsDate: {
    fontSize: 11,
    color: Palette.iconInactive,
  },
  momentsStarter: {
    fontSize: 11,
    color: Palette.iconInactive,
    lineHeight: 15,
    marginTop: 2,
  },

  // Initial avatar (birthday tiles)
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Moments modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.tabBarBorder,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Palette.iconInactive,
    marginTop: 2,
  },
  modalStarter: {
    fontSize: 14,
    color: Palette.text,
    lineHeight: 20,
    fontStyle: 'italic',
    opacity: 0.75,
  },
  modalContactsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.iconInactive,
    marginTop: 4,
  },
  modalRoster: {
    gap: 8,
  },
});
