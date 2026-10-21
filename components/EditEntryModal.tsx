// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import ShamsiDatePicker from '@/components/ShamsiDatePicker';
import type { Entry } from '@/hooks/useEntries';
import { sanitizeNationalCode } from '@/services/extractionService';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface Props {
  visible: boolean;
  entry: Entry | null;
  onClose: () => void;
  onSave: (id: string, changes: Partial<Entry>) => void;
  startOnDate?: boolean;
}

interface FieldConfig {
  key: keyof Omit<Entry, 'id' | 'createdAt' | 'rawText'>;
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}

const FIELDS: FieldConfig[] = [
  {
    key: 'date',
    label: 'تاریخ شمسی',
    icon: 'event',
    color: Colors.primary,
    bg: Colors.accent,
    placeholder: '1405/06/10',
  },
  {
    key: 'amount',
    label: 'مبلغ',
    icon: 'payments',
    color: Colors.amount,
    bg: Colors.amountLight,
    placeholder: '5000000',
    keyboardType: 'numeric',
  },
  {
    key: 'sayyadId',
    label: 'شناسه صیاد (۱۶ رقم)',
    icon: 'fingerprint',
    color: Colors.sayyad,
    bg: Colors.sayyadLight,
    placeholder: '1234567890123456',
    keyboardType: 'numeric',
  },
  {
    key: 'checkSerial',
    label: 'سریال چک',
    icon: 'receipt-long',
    color: Colors.check,
    bg: Colors.checkLight,
    placeholder: '156/054770',
  },
  {
    key: 'name',
    label: 'نام',
    icon: 'person-outline',
    color: Colors.primary,
    bg: Colors.accent,
    placeholder: 'علی رضایی',
  },
  {
    key: 'nationalCode',
    label: 'کد ملی',
    icon: 'credit-card',
    color: Colors.national,
    bg: Colors.nationalLight,
    placeholder: '0012345678',
    keyboardType: 'numeric',
  },
];

export default function EditEntryModal({ visible, entry, onClose, onSave, startOnDate }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLegal, setIsLegal] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (entry) {
      const initial: Record<string, string> = {};
      FIELDS.forEach((f) => {
        initial[f.key] = (entry[f.key] as string | null) ?? '';
      });
      setForm(initial);
      const code = (entry.nationalCode ?? '').replace(/\D/g, '');
      setIsLegal(!!entry.isLegal || code.length === 11);
    }
  }, [entry]);

  useEffect(() => {
    if (!visible) {
      setDatePickerOpen(false);
      return;
    }
    if (startOnDate) setDatePickerOpen(true);
  }, [visible, startOnDate, entry]);

  const applyLegal = (next: boolean) => {
    setIsLegal(next);
    setForm((prev) => ({
      ...prev,
      nationalCode: sanitizeNationalCode(prev.nationalCode ?? '', next),
    }));
  };

  const onNationalChange = (value: string) => {
    const digits = sanitizeNationalCode(value, true);
    if (!isLegal && digits.length > 10) {
      setIsLegal(true);
      setForm((prev) => ({ ...prev, nationalCode: digits }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      nationalCode: sanitizeNationalCode(value, isLegal),
    }));
  };

  const handleSave = () => {
    if (!entry) return;
    const changes: Partial<Entry> = { isLegal };
    FIELDS.forEach((f) => {
      const raw = form[f.key]?.trim() || '';
      const val =
        f.key === 'nationalCode' ? sanitizeNationalCode(raw, isLegal) || null : raw || null;
      (changes as Record<string, string | null | boolean>)[f.key] = val;
    });
    onSave(entry.id, changes);
    onClose();
  };

  const closePickerOrModal = () => {
    if (datePickerOpen) {
      setDatePickerOpen(false);
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closePickerOrModal}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={closePickerOrModal} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{datePickerOpen ? 'انتخاب تاریخ شمسی' : 'ویرایش آیتم'}</Text>
            <Pressable
              onPress={closePickerOrModal}
              hitSlop={8}
              style={({ pressed }) => (pressed ? { opacity: 0.6 } : {})}
            >
              <MaterialIcons
                name={datePickerOpen ? 'arrow-forward' : 'close'}
                size={24}
                color={Colors.textSecondary}
              />
            </Pressable>
          </View>

          {datePickerOpen ? (
            <ShamsiDatePicker
              value={form['date'] ?? ''}
              onConfirm={(date) => {
                setForm((prev) => ({ ...prev, date }));
                setDatePickerOpen(false);
                if (startOnDate && entry) {
                  onSave(entry.id, { date });
                  onClose();
                }
              }}
              onClear={() => {
                setForm((prev) => ({ ...prev, date: '' }));
                setDatePickerOpen(false);
                if (startOnDate && entry) {
                  onSave(entry.id, { date: null });
                  onClose();
                }
              }}
            />
          ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {FIELDS.map((field) => {
              const label =
                field.key === 'nationalCode'
                  ? isLegal
                    ? 'شناسه ملی (۱۱ رقم)'
                    : 'کد ملی (۱۰ رقم)'
                  : field.label;
              return (
              <View key={field.key} style={styles.fieldWrap}>
                <View style={styles.fieldLabelRow}>
                  <MaterialIcons name={field.icon} size={15} color={field.color} />
                  <Text style={[styles.fieldLabel, { color: field.color }]}>{label}</Text>
                  {field.key === 'nationalCode' ? (
                    <Pressable
                      onPress={() => applyLegal(!isLegal)}
                      style={styles.legalToggle}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isLegal }}
                    >
                      <Text style={[styles.legalToggleText, { color: isLegal ? field.color : Colors.textMuted }]}>
                        حقوقی
                      </Text>
                      <MaterialIcons
                        name={isLegal ? 'check-box' : 'check-box-outline-blank'}
                        size={18}
                        color={isLegal ? field.color : Colors.textMuted}
                      />
                    </Pressable>
                  ) : null}
                </View>
                {field.key === 'date' ? (
                  <Pressable
                    onPress={() => setDatePickerOpen(true)}
                    style={[
                      styles.input,
                      styles.dateField,
                      { borderColor: form[field.key] ? field.color + '55' : Colors.border },
                      form[field.key] ? { backgroundColor: field.bg } : {},
                    ]}
                  >
                    <MaterialIcons
                      name="calendar-today"
                      size={18}
                      color={form[field.key] ? field.color : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.dateFieldText,
                        { color: form[field.key] ? Colors.textPrimary : Colors.textMuted },
                      ]}
                    >
                      {form[field.key]?.trim() || 'برای تنظیم تاریخ بزنید'}
                    </Text>
                  </Pressable>
                ) : (
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: form[field.key] ? field.color + '55' : Colors.border },
                    form[field.key] ? { backgroundColor: field.bg } : {},
                  ]}
                  value={form[field.key] ?? ''}
                  onChangeText={
                    field.key === 'nationalCode'
                      ? onNationalChange
                      : (v) => setForm((prev) => ({ ...prev, [field.key]: v }))
                  }
                  placeholder={
                    field.key === 'nationalCode' ? (isLegal ? '12345678901' : field.placeholder) : field.placeholder
                  }
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  keyboardType={field.keyboardType ?? 'default'}
                  maxLength={field.key === 'nationalCode' ? (isLegal ? 11 : 10) : undefined}
                  returnKeyType="next"
                />
                )}
              </View>
            );})}

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
            >
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>ذخیره تغییرات</Text>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.sm + 2,
  },
  fieldWrap: {
    gap: Spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  legalToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  legalToggleText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  dateField: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFieldText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
