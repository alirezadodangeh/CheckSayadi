import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import {
  JALALI_MONTHS,
  daysInJalaliMonth,
  formatShamsi,
  parseShamsi,
  todayJalali,
} from '@/services/jalali';
import { toEnglishNumeric } from '@/services/extractionService';

interface Props {
  value: string;
  onConfirm: (date: string) => void;
  onClear: () => void;
}

export default function ShamsiDatePicker({ value, onConfirm, onClear }: Props) {
  const initial = parseShamsi(value) ?? todayJalali();
  const today = useMemo(() => todayJalali(), []);
  const [year, setYear] = useState(initial.year);
  const [yearText, setYearText] = useState(String(initial.year));
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const maxDay = daysInJalaliMonth(year, month);
  const safeDay = Math.min(day, maxDay);

  const shiftYear = (delta: number) => {
    setYear((current) => {
      const next = Math.min(1500, Math.max(1300, current + delta));
      setYearText(String(next));
      return next;
    });
  };

  const setYearFromText = (text: string) => {
    const digits = toEnglishNumeric(text).replace(/\D/g, '').slice(0, 4);
    setYearText(digits);
    if (digits.length !== 4) return;
    const next = parseInt(digits, 10);
    if (next >= 1300 && next <= 1500) setYear(next);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.preview}>{formatShamsi(year, month, safeDay)}</Text>

      <View style={styles.yearRow}>
        <Pressable
          onPress={() => shiftYear(-1)}
          style={({ pressed }) => [styles.yearBtn, pressed && styles.pressed]}
          hitSlop={6}
        >
          <MaterialIcons name="chevron-right" size={22} color={Colors.primary} />
          <Text style={styles.yearBtnText}>سال قبل</Text>
        </Pressable>

        <TextInput
          style={styles.yearInput}
          value={yearText}
          onChangeText={setYearFromText}
          keyboardType="number-pad"
          maxLength={4}
          textAlign="center"
          selectTextOnFocus
        />

        <Pressable
          onPress={() => shiftYear(1)}
          style={({ pressed }) => [styles.yearBtn, pressed && styles.pressed]}
          hitSlop={6}
        >
          <Text style={styles.yearBtnText}>سال بعد</Text>
          <MaterialIcons name="chevron-left" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.monthGrid}>
        {JALALI_MONTHS.map((name, index) => {
          const monthNumber = index + 1;
          const selected = monthNumber === month;
          return (
            <Pressable
              key={name}
              onPress={() => setMonth(monthNumber)}
              style={[styles.monthChip, selected && styles.monthChipSelected]}
            >
              <Text style={[styles.monthText, selected && styles.monthTextSelected]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dayGrid}>
        {Array.from({ length: maxDay }, (_, index) => {
          const dayNumber = index + 1;
          const selected = dayNumber === safeDay;
          const isToday =
            year === today.year && month === today.month && dayNumber === today.day;
          return (
            <Pressable
              key={dayNumber}
              onPress={() => setDay(dayNumber)}
              style={[
                styles.dayCell,
                isToday && !selected && styles.dayCellToday,
                selected && styles.dayCellSelected,
              ]}
            >
              <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{dayNumber}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
        onPress={() => onConfirm(formatShamsi(year, month, safeDay))}
      >
        <MaterialIcons name="event-available" size={20} color="#fff" />
        <Text style={styles.confirmText}>ثبت تاریخ</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
        onPress={onClear}
      >
        <Text style={styles.clearText}>پاک کردن تاریخ</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.todayBtn, pressed && styles.pressed]}
        onPress={() => {
          setYear(today.year);
          setYearText(String(today.year));
          setMonth(today.month);
          setDay(today.day);
        }}
      >
        <Text style={styles.todayText}>برو به امروز</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  preview: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    writingDirection: 'ltr',
    marginBottom: Spacing.xs,
  },
  yearRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  yearBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  yearBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  yearInput: {
    minWidth: 88,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  monthGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  monthChip: {
    width: '31%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  monthChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  monthTextSelected: {
    color: '#fff',
  },
  dayGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    writingDirection: 'ltr',
  },
  dayTextSelected: {
    color: '#fff',
  },
  confirmBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  confirmText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  clearText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  todayBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  todayText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
