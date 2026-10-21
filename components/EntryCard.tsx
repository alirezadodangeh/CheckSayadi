// Powered by OnSpace.AI
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { useAlert } from '@/template';
import type { Entry } from '@/hooks/useEntries';
import { formatAmount, toEnglishNumeric } from '@/services/extractionService';

interface Props {
  entry: Entry;
  onDelete: (id: string) => void;
  onEdit: (entry: Entry) => void;
  onSetDate: (entry: Entry) => void;
}

function EntryCard({ entry, onDelete, onEdit, onSetDate }: Props) {
  const { showAlert } = useAlert();

  const handleDelete = () => {
    showAlert('حذف', 'این آیتم حذف شود؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => onDelete(entry.id) },
    ]);
  };

  const hasStructured =
    !!entry.amount ||
    !!entry.sayyadId ||
    !!entry.name ||
    !!entry.nationalCode ||
    !!entry.checkSerial;

  const meta = [
    entry.sayyadId ? { key: 'sayyad', label: `صیاد ${entry.sayyadId}`, color: Colors.sayyad } : null,
    entry.checkSerial ? { key: 'serial', label: `سریال ${entry.checkSerial}`, color: Colors.check } : null,
    entry.nationalCode
      ? {
          key: 'national',
          label: `${entry.isLegal ? 'شناسه' : 'کد'} ${entry.nationalCode}`,
          color: Colors.national,
        }
      : null,
  ].filter((item): item is { key: string; label: string; color: string } => item !== null);

  const flags = [
    entry.guarantee ? { key: 'guarantee', label: 'ضمانت', color: Colors.warning, bg: Colors.warningLight } : null,
    entry.passed ? { key: 'passed', label: 'پاس شد', color: Colors.success, bg: Colors.successLight } : null,
    entry.returned ? { key: 'returned', label: 'برگشت خورده', color: Colors.error, bg: Colors.errorLight } : null,
  ].filter((item): item is { key: string; label: string; color: string; bg: string } => item !== null);

  return (
    <View style={styles.card}>
      <View style={[styles.dateBanner, !entry.date && styles.dateBannerEmpty]}>
        <MaterialIcons
          name="event"
          size={16}
          color={entry.date ? Colors.primary : Colors.warning}
        />
        <Text style={[styles.dateText, !entry.date && styles.dateTextEmpty]}>
          {entry.date ? toEnglishNumeric(entry.date) : 'بدون تاریخ'}
        </Text>
        {entry.color ? <View style={[styles.colorDot, { backgroundColor: entry.color }]} /> : null}
      </View>

      <View style={styles.top}>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {entry.name?.trim() || 'بدون عنوان'}
          </Text>
          {entry.amount ? (
            <Text style={styles.amount} numberOfLines={1}>
              {formatAmount(entry.amount)}
              <Text style={styles.currency}> ریال</Text>
            </Text>
          ) : null}
        </View>
      </View>

      {meta.length > 0 ? (
        <View style={styles.metaRow}>
          {meta.map((item) => (
            <View key={item.key} style={styles.meta}>
              {item.key === 'serial' ? (
                <MaterialCommunityIcons name="bank-check" size={12} color={item.color} />
              ) : null}
              <Text style={[styles.metaText, { color: item.color }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      ) : !hasStructured ? (
        <Text style={styles.noData} numberOfLines={1}>
          {entry.rawText?.trim() || 'اطلاعاتی استخراج نشد'}
        </Text>
      ) : null}

      {entry.forWhom?.trim() ? (
        <Text style={styles.forWhom} numberOfLines={1}>
          برای {entry.forWhom.trim()}
        </Text>
      ) : null}
      {entry.description?.trim() ? (
        <Text style={styles.note} numberOfLines={1}>
          {entry.description.trim()}
        </Text>
      ) : null}
      {flags.length > 0 ? (
        <View style={styles.flagRow}>
          {flags.map((flag) => (
            <Text key={flag.key} style={[styles.flag, { color: flag.color, backgroundColor: flag.bg }]}>
              {flag.label}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          onPress={() => onEdit(entry)}
          hitSlop={6}
        >
          <MaterialIcons name="edit" size={15} color={Colors.primary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            !entry.date && styles.dateMissing,
            pressed && styles.pressed,
          ]}
          onPress={() => onSetDate(entry)}
          hitSlop={6}
        >
          <MaterialIcons
            name="event"
            size={15}
            color={entry.date ? Colors.primary : Colors.textMuted}
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.pressed]}
          onPress={handleDelete}
          hitSlop={6}
        >
          <MaterialIcons name="delete-outline" size={15} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

export default memo(EntryCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 12,
    marginBottom: 6,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dateBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  dateBannerEmpty: {
    backgroundColor: Colors.warningLight,
  },
  dateText: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  dateTextEmpty: {
    color: Colors.warning,
    writingDirection: 'rtl',
  },
  forWhom: {
    marginTop: 4,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  note: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  flagRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  flag: {
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  top: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  identity: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.amount,
    writingDirection: 'ltr',
  },
  currency: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.amount,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: 6,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  dateMissing: {
    backgroundColor: Colors.borderLight,
  },
  deleteBtn: {
    backgroundColor: Colors.errorLight,
  },
  pressed: {
    opacity: 0.6,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  noData: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
