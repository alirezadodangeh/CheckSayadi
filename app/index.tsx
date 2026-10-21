// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { useEntries } from '@/hooks/useEntries';
import type { Entry } from '@/hooks/useEntries';
import EntryCard from '@/components/EntryCard';
import AddEntryModal from '@/components/AddEntryModal';
import EditEntryModal from '@/components/EditEntryModal';
import { ExtractedData, toEnglishNumeric } from '@/services/extractionService';
import { JALALI_MONTHS, parseShamsi } from '@/services/jalali';

type FlatItem =
  | { type: 'header'; title: string; count: number; id: string }
  | { type: 'entry'; entry: Entry; id: string };

type FlagFilter = 'guarantee' | 'passed' | 'returned';

const FLAG_FILTERS: { key: FlagFilter; label: string }[] = [
  { key: 'guarantee', label: 'ضمانت' },
  { key: 'passed', label: 'پاس شد' },
  { key: 'returned', label: 'برگشت خورده' },
];

function fold(value: string): string {
  return toEnglishNumeric(value)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function monthKey(date: string | null): string {
  if (!date) return '__nodate__';
  const parsed = parseShamsi(date);
  if (parsed) return `${parsed.year}/${String(parsed.month).padStart(2, '0')}`;
  const parts = toEnglishNumeric(date).split('/');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0]}/${parts[1].padStart(2, '0')}`;
  }
  return '__nodate__';
}

function monthTitle(key: string): string {
  if (key === '__nodate__') return 'تاریخ نامشخص';
  const [year, month] = key.split('/');
  const name = JALALI_MONTHS[parseInt(month, 10) - 1];
  return name ? `${name} ${year}` : key;
}

function groupByMonth(entries: Entry[]): { key: string; title: string; data: Entry[] }[] {
  const groups: Record<string, Entry[]> = {};
  for (const entry of entries) {
    const key = monthKey(entry.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return Object.keys(groups).map((key) => ({
    key,
    title: monthTitle(key),
    data: groups[key],
  }));
}

export default function HomeScreen() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useEntries();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [startOnDate, setStartOnDate] = useState(false);
  const [query, setQuery] = useState('');
  const [flags, setFlags] = useState<Record<FlagFilter, boolean>>({
    guarantee: false,
    passed: false,
    returned: false,
  });

  const filtering = query.trim().length > 0 || flags.guarantee || flags.passed || flags.returned;

  const filteredEntries = useMemo(() => {
    const q = fold(query.trim());
    return entries.filter((entry) => {
      if (flags.guarantee && !entry.guarantee) return false;
      if (flags.passed && !entry.passed) return false;
      if (flags.returned && !entry.returned) return false;
      if (!q) return true;
      const hay = fold(
        [
          entry.date,
          entry.amount,
          entry.sayyadId,
          entry.name,
          entry.nationalCode,
          entry.checkSerial,
          entry.description,
          entry.forWhom,
          entry.rawText,
        ]
          .filter(Boolean)
          .join(' '),
      );
      return hay.includes(q);
    });
  }, [entries, query, flags]);

  const handleSave = async (data: ExtractedData) => {
    await addEntry(data);
  };

  const handleEdit = (entry: Entry) => {
    setStartOnDate(false);
    setEditingEntry(entry);
  };

  const handleSetDate = (entry: Entry) => {
    setStartOnDate(true);
    setEditingEntry(entry);
  };

  const closeEditor = () => {
    setEditingEntry(null);
    setStartOnDate(false);
  };

  const handleUpdate = async (id: string, changes: Partial<Entry>) => {
    await updateEntry(id, changes);
  };

  const renderSectionSeparator = (title: string, count: number) => (
    <View style={styles.sectionSep}>
      <View style={styles.sectionLine} />
      <View style={styles.sectionBadge}>
        <MaterialIcons name="calendar-month" size={16} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count} چک</Text>
      </View>
      <View style={styles.sectionLine} />
    </View>
  );

  const flatData: FlatItem[] = [];
  const groups = groupByMonth(filteredEntries);
  for (const group of groups) {
    flatData.push({ type: 'header', title: group.title, count: group.data.length, id: `h_${group.key}` });
    for (const entry of group.data) {
      flatData.push({ type: 'entry', entry, id: entry.id });
    }
  }

  const renderFlatItem = ({ item }: { item: FlatItem }) => {
    if (item.type === 'header') {
      return renderSectionSeparator(item.title, item.count);
    }
    return (
      <EntryCard
        entry={item.entry}
        onDelete={deleteEntry}
        onEdit={handleEdit}
        onSetDate={handleSetDate}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="bank-check" size={18} color="#fff" />
          <Text style={styles.appTitle}>استخراج اسناد</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={styles.headerIconBtn}
          >
            <MaterialIcons name="settings" size={20} color="#fff" />
          </Pressable>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {filtering ? `${filteredEntries.length}/${entries.length}` : entries.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('@/assets/images/empty-state.png')}
            style={styles.emptyImage}
            contentFit="contain"
            transition={300}
          />
          <Text style={styles.emptyTitle}>لیست خالی است</Text>
          <Text style={styles.emptySubtitle}>
            برای افزودن آیتم جدید، دکمه + را بزنید
          </Text>
        </View>
      ) : (
        <View style={styles.sheet}>
          <View style={styles.filterWrap}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="جستجو نام، مبلغ، صیاد، توضیحات..."
                placeholderTextColor={Colors.textMuted}
                textAlign="right"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.chipRow}>
              {FLAG_FILTERS.map((item) => {
                const active = flags[item.key];
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setFlags((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={[styles.chip, active && styles.chipOn]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
              <Text style={styles.totalText}>
                {filtering
                  ? `${filteredEntries.length} از ${entries.length}`
                  : `${entries.length} آیتم`}
              </Text>
            </View>
          </View>
          {filteredEntries.length === 0 ? (
            <View style={styles.noResult}>
              <Text style={styles.noResultText}>موردی با این فیلتر پیدا نشد</Text>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={flatData}
              keyExtractor={(item) => item.id}
              renderItem={renderFlatItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </Pressable>

      {/* Add Modal */}
      <AddEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      {/* Edit Modal */}
      <EditEntryModal
        visible={editingEntry !== null}
        entry={editingEntry}
        startOnDate={startOnDate}
        onClose={closeEditor}
        onSave={handleUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  appHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'right',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#fff',
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.lg,
    opacity: 0.85,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  filterWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 4,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextOn: {
    color: '#fff',
  },
  noResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  noResultText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 100,
  },
  totalText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    marginRight: 'auto',
  },
  sectionSep: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: 6,
    marginBottom: 4,
    gap: Spacing.xs,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionCount: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: Spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
});
