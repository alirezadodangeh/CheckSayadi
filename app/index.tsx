// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { useEntries } from '@/hooks/useEntries';
import type { Entry } from '@/hooks/useEntries';
import EntryCard from '@/components/EntryCard';
import AddEntryModal from '@/components/AddEntryModal';
import EditEntryModal from '@/components/EditEntryModal';
import { ExtractedData } from '@/services/extractionService';

type FlatItem =
  | { type: 'header'; date: string; id: string }
  | { type: 'entry'; entry: Entry; id: string };

function groupByDate(entries: Entry[]): { title: string; data: Entry[] }[] {
  const groups: Record<string, Entry[]> = {};
  for (const entry of entries) {
    const key = entry.date ?? '__nodate__';
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return Object.keys(groups).map((key) => ({
    title: key === '__nodate__' ? 'تاریخ نامشخص' : key,
    data: groups[key],
  }));
}

export default function HomeScreen() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useEntries();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [startOnDate, setStartOnDate] = useState(false);

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

  const renderHeader = () => {
    if (entries.length === 0) return null;
    return (
      <View style={styles.listHeader}>
        <Text style={styles.totalText}>{entries.length} آیتم ثبت‌شده</Text>
      </View>
    );
  };

  const renderSectionSeparator = (date: string) => (
    <View style={styles.sectionSep}>
      <View style={styles.sectionLine} />
      <View style={styles.sectionBadge}>
        <MaterialIcons name="event" size={12} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{date}</Text>
      </View>
      <View style={styles.sectionLine} />
    </View>
  );

  const flatData: FlatItem[] = [];
  const groups = groupByDate(entries);
  for (const group of groups) {
    flatData.push({ type: 'header', date: group.title, id: `h_${group.title}` });
    for (const entry of group.data) {
      flatData.push({ type: 'entry', entry, id: entry.id });
    }
  }

  const renderFlatItem = ({ item }: { item: FlatItem }) => {
    if (item.type === 'header') {
      return renderSectionSeparator(item.date);
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
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="description" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.appTitle}>استخراج اسناد</Text>
            <Text style={styles.appSubtitle}>مرتب‌شده بر اساس تاریخ شمسی</Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{entries.length}</Text>
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
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={renderFlatItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'right',
  },
  appSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
    marginTop: 2,
  },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  countText: {
    fontSize: FontSize.md,
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
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '100%',
  },
  listHeader: {
    flexDirection: 'row-reverse',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  totalText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sectionSep: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
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
