import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { MOCK_PEOPLE } from '@/data/mock';
import type { Person, InteractionType } from '@/types';
import { tierColor, tierLabel } from '@/utils/people';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InteractionOption {
  type: InteractionType;
  label: string;
  icon: string;
}

const INTERACTION_OPTIONS: InteractionOption[] = [
  { type: 'call',      label: 'Call',      icon: 'phone.fill' },
  { type: 'facetime',  label: 'FaceTime',  icon: 'video.fill' },
  { type: 'text',      label: 'Text',      icon: 'message.fill' },
  { type: 'email',     label: 'Email',     icon: 'envelope.fill' },
  { type: 'in_person', label: 'In Person', icon: 'person.2.fill' },
];

export interface Props {
  visible: boolean;
  /** Pre-fill with a specific person (e.g. from "Mark as Complete") */
  initialPerson?: Person | null;
  onClose: () => void;
  onSave?: (person: Person, type: InteractionType, notes: string, date: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function offsetDateISO(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

function displayDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LogModal({ visible, initialPerson, onClose, onSave }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedType, setSelectedType] = useState<InteractionType>('call');
  const [interactionDate, setInteractionDate] = useState(todayISO);
  const [notes, setNotes] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Reset when modal opens; focus search input after slide animation completes
  useEffect(() => {
    if (visible) {
      const person = initialPerson ?? null;
      setSelectedPerson(person);
      setSelectedType(person?.nudge_interaction_type ?? 'call');
      setInteractionDate(todayISO());
      setSearchQuery('');
      setNotes('');
      if (!person) {
        const t = setTimeout(() => searchInputRef.current?.focus(), 350);
        return () => clearTimeout(t);
      }
    }
  }, [visible, initialPerson?.id]);

  function selectPerson(p: Person) {
    setSelectedPerson(p);
    setSelectedType(p.nudge_interaction_type);
    setSearchQuery('');
  }

  function clearPerson() {
    setSelectedPerson(null);
    setSearchQuery('');
  }

  function pickDate() {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Today', 'Yesterday', '2 days ago', '3 days ago', 'Earlier...'],
        cancelButtonIndex: 0,
      },
      (idx) => {
        if (idx === 0) return;
        if (idx >= 1 && idx <= 4) {
          setInteractionDate(offsetDateISO(idx - 1));
        } else if (idx === 5) {
          Alert.prompt(
            'Date',
            'Enter date (YYYY-MM-DD)',
            (text) => {
              const trimmed = text.trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                setInteractionDate(trimmed);
              }
            },
            'plain-text',
            interactionDate,
          );
        }
      }
    );
  }

  function handleSave() {
    if (!selectedPerson) return;
    onSave?.(selectedPerson, selectedType, notes, interactionDate);
    onClose();
  }

  const filteredPeople =
    searchQuery.length >= 1
      ? MOCK_PEOPLE.filter((p) =>
          `${p.first_name} ${p.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ).slice(0, 6)
      : [];

  const personColor = selectedPerson ? tierColor(selectedPerson.cadence_tier) : Palette.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Log Interaction</Text>

            {/* ── Person search / selection ── */}
            {!selectedPerson ? (
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <IconSymbol name="magnifyingglass" size={15} color={Palette.iconInactive} />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Search contacts..."
                    placeholderTextColor={Palette.iconInactive}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                      <IconSymbol name="xmark.circle.fill" size={15} color={Palette.iconInactive} />
                    </TouchableOpacity>
                  )}
                </View>
                {filteredPeople.length > 0 && (
                  <View style={styles.searchResults}>
                    {filteredPeople.map((p, i) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.searchResultRow,
                          i < filteredPeople.length - 1 && styles.searchResultRowBorder,
                        ]}
                        onPress={() => selectPerson(p)}
                        activeOpacity={0.7}>
                        <View style={[styles.dot, { backgroundColor: tierColor(p.cadence_tier) }]} />
                        <Text style={styles.searchResultName}>
                          {p.first_name} {p.last_name}
                        </Text>
                        <Text style={styles.searchResultTier}>{tierLabel(p.cadence_tier)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Person chip */}
                <TouchableOpacity
                  style={[styles.personChip, { borderColor: personColor + '60' }]}
                  onPress={clearPerson}
                  activeOpacity={0.7}>
                  <View style={[styles.dot, { backgroundColor: personColor }]} />
                  <Text style={styles.personChipName}>
                    {selectedPerson.first_name} {selectedPerson.last_name}
                  </Text>
                  <IconSymbol name="xmark" size={11} color={Palette.iconInactive} />
                </TouchableOpacity>

                {/* Interaction type */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>How did you connect?</Text>
                  <View style={styles.typePills}>
                    {INTERACTION_OPTIONS.map(({ type, label, icon }) => {
                      const active = selectedType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.typePill, active && styles.typePillActive]}
                          onPress={() => setSelectedType(type)}
                          activeOpacity={0.75}>
                          <IconSymbol
                            name={icon}
                            size={13}
                            color={active ? '#fff' : Palette.iconInactive}
                          />
                          <Text style={[styles.typePillLabel, active && styles.typePillLabelActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>When?</Text>
                  <TouchableOpacity style={styles.dateRow} onPress={pickDate} activeOpacity={0.7}>
                    <IconSymbol name="calendar" size={15} color={Palette.iconInactive} />
                    <Text style={styles.dateText}>{displayDate(interactionDate)}</Text>
                    <IconSymbol name="chevron.right" size={12} color={Palette.iconInactive} />
                  </TouchableOpacity>
                </View>

                {/* Notes */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="What did you talk about?"
                    placeholderTextColor={Palette.iconInactive}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Save */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.tabBarBorder,
  },
  scroll: {},
  scrollContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 44,
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.3,
  },

  // Search
  searchSection: { gap: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
  },
  searchResults: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  searchResultRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.tabBarBorder,
  },
  searchResultName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Palette.text,
  },
  searchResultTier: {
    fontSize: 12,
    color: Palette.iconInactive,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },

  // Person chip
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  personChipName: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },

  // Fields
  fieldBlock: { gap: 10 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.iconInactive,
    letterSpacing: 0.2,
  },
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Palette.cardSurface,
    borderWidth: 1,
    borderColor: Palette.tabBarBorder,
  },
  typePillActive: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  typePillLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.iconInactive,
  },
  typePillLabelActive: {
    color: '#fff',
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
  },

  notesInput: {
    backgroundColor: Palette.cardSurface,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Palette.text,
    minHeight: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.tabBarBorder,
  },

  // Save
  saveBtn: {
    backgroundColor: Palette.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
