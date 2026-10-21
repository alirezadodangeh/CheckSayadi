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
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import ShamsiDatePicker from '@/components/ShamsiDatePicker';
import type { Entry } from '@/hooks/useEntries';
import { extractData, formatAmount, sanitizeNationalCode, toEnglishNumeric } from '@/services/extractionService';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const MARK_COLORS = [
  '#E53E3E',
  '#DD6B20',
  '#D69E2E',
  '#38A169',
  '#0694A2',
  '#1A5FA8',
  '#6B46C1',
  '#D53F8C',
  '#2D3748',
];

interface Props {
  visible: boolean;
  entry: Entry | null;
  onClose: () => void;
  onSave: (id: string, changes: Partial<Entry>) => void;
  startOnDate?: boolean;
}

type FieldKey = 'date' | 'amount' | 'sayyadId' | 'name' | 'nationalCode' | 'checkSerial';

interface FieldConfig {
  key: FieldKey;
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
    key: 'checkSerial',
    label: 'سریال چک',
    icon: 'receipt-long',
    color: Colors.check,
    bg: Colors.checkLight,
    placeholder: '156/054770',
  },
  {
    key: 'amount',
    label: 'مبلغ',
    icon: 'payments',
    color: Colors.amount,
    bg: Colors.amountLight,
    placeholder: '5,000,000',
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
  const [text, setText] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLegal, setIsLegal] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [markColor, setMarkColor] = useState<string | null>(null);
  const [guarantee, setGuarantee] = useState(false);
  const [passed, setPassed] = useState(false);
  const [returned, setReturned] = useState(false);

  useEffect(() => {
    if (!visible || !entry) return;
    const initial: Record<string, string> = {};
    FIELDS.forEach((f) => {
      const raw = (entry[f.key] as string | null) ?? '';
      initial[f.key] = f.key === 'name' ? raw : f.key === 'amount' ? formatAmount(raw) : toEnglishNumeric(raw);
    });
    setForm(initial);
    setText(entry.rawText ?? '');
    const code = (entry.nationalCode ?? '').replace(/\D/g, '');
    setIsLegal(!!entry.isLegal || code.length === 11);
    setDescription(entry.description ?? '');
    setForWhom(entry.forWhom ?? '');
    setMarkColor(entry.color ?? null);
    setGuarantee(!!entry.guarantee);
    setPassed(!!entry.passed);
    setReturned(!!entry.returned);
    setMoreOpen(
      !!(entry.description || entry.forWhom || entry.color || entry.guarantee || entry.passed || entry.returned),
    );
  }, [entry, visible]);

  useEffect(() => {
    if (!visible) {
      setDatePickerOpen(false);
      return;
    }
    if (startOnDate) setDatePickerOpen(true);
  }, [visible, startOnDate, entry]);

  const applyLegal = (next: boolean) => {
    setIsLegal(next);
    setForm((prev) => {
      const fromText = text.trim() ? extractData(text.trim(), { legal: next }).nationalCode : null;
      if (fromText) return { ...prev, nationalCode: fromText };
      return { ...prev, nationalCode: sanitizeNationalCode(prev.nationalCode ?? '', next) };
    });
  };

  const handleExtract = () => {
    if (!text.trim() || processing) return;
    setProcessing(true);
    setTimeout(() => {
      const result = extractData(text.trim(), { legal: isLegal });
      const next: Record<string, string> = {};
      FIELDS.forEach((f) => {
        const value = (result[f.key] as string | null) ?? '';
        next[f.key] = f.key === 'name' ? value : f.key === 'amount' ? formatAmount(value) : toEnglishNumeric(value);
      });
      setForm(next);
      setProcessing(false);
    }, 300);
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
    const changes: Partial<Entry> = {
      isLegal,
      rawText: text,
      description: description.trim() || null,
      forWhom: forWhom.trim() || null,
      color: markColor,
      guarantee,
      passed,
      returned,
    };
    FIELDS.forEach((f) => {
      const raw = form[f.key]?.trim() || '';
      const normalized =
        f.key === 'name' ? raw : f.key === 'amount' ? formatAmount(raw) : toEnglishNumeric(raw);
      const val =
        f.key === 'nationalCode' ? sanitizeNationalCode(normalized, isLegal) || null : normalized || null;
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
            <Text style={styles.inputLabel}>متن را وارد کنید</Text>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={setText}
              placeholder="متن شامل تاریخ، مبلغ، شناسه صیاد، سریال چک و... را اینجا بنویسید یا بچسبانید"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={6}
              textAlign="right"
              textAlignVertical="top"
            />

            <Pressable
              style={({ pressed }) => [
                styles.extractBtn,
                (!text.trim() || processing) && styles.extractBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleExtract}
              disabled={!text.trim() || processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MaterialIcons name="auto-awesome" size={18} color="#fff" />
              )}
              <Text style={styles.extractBtnText}>
                {processing ? 'در حال استخراج...' : 'استخراج اطلاعات'}
              </Text>
            </Pressable>

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
                  {field.key === 'checkSerial' ? (
                    <MaterialCommunityIcons name="bank-check" size={15} color={field.color} />
                  ) : (
                    <MaterialIcons name={field.icon} size={15} color={field.color} />
                  )}
                  <Text
                    style={[
                      styles.fieldLabel,
                      field.key === 'name' ? styles.rtlInput : styles.ltrInput,
                      { color: field.color },
                    ]}
                  >
                    {label}
                  </Text>
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
                        form[field.key]?.trim() ? styles.ltrInput : styles.rtlInput,
                        { color: form[field.key] ? Colors.textPrimary : Colors.textMuted },
                      ]}
                    >
                      {form[field.key]?.trim() ? toEnglishNumeric(form[field.key]) : 'برای تنظیم تاریخ بزنید'}
                    </Text>
                  </Pressable>
                ) : (
                <TextInput
                  style={[
                    styles.input,
                    field.key === 'name' ? styles.rtlInput : styles.ltrInput,
                    { borderColor: form[field.key] ? field.color + '55' : Colors.border },
                    form[field.key] ? { backgroundColor: field.bg } : {},
                  ]}
                  value={form[field.key] ?? ''}
                  onChangeText={
                    field.key === 'nationalCode'
                      ? onNationalChange
                      : (v) =>
                          setForm((prev) => ({
                            ...prev,
                            [field.key]:
                              field.key === 'name'
                                ? v
                                : field.key === 'amount'
                                  ? formatAmount(v)
                                  : toEnglishNumeric(v),
                          }))
                  }
                  placeholder={
                    field.key === 'nationalCode' ? (isLegal ? '12345678901' : field.placeholder) : field.placeholder
                  }
                  placeholderTextColor={Colors.textMuted}
                  textAlign={field.key === 'name' ? 'right' : 'left'}
                  keyboardType={field.keyboardType ?? 'default'}
                  maxLength={field.key === 'nationalCode' ? (isLegal ? 11 : 10) : undefined}
                  returnKeyType="next"
                />
                )}
              </View>
            );})}

            <Pressable
              style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setMoreOpen((open) => !open)}
            >
              <MaterialIcons name="tune" size={18} color={Colors.primary} />
              <Text style={styles.moreBtnText}>تنظیمات بیشتر</Text>
              <MaterialIcons
                name={moreOpen ? 'expand-less' : 'expand-more'}
                size={20}
                color={Colors.primary}
              />
            </Pressable>

            {moreOpen ? (
              <View style={styles.moreBox}>
                <Text style={styles.inputLabel}>توضیحات</Text>
                <TextInput
                  style={styles.noteInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="توضیح این مورد"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlign="right"
                  textAlignVertical="top"
                />

                <Pressable
                  onPress={() => setGuarantee((value) => !value)}
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: guarantee }}
                >
                  <MaterialIcons
                    name={guarantee ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={guarantee ? Colors.warning : Colors.textMuted}
                  />
                  <Text style={[styles.checkLabel, guarantee && { color: Colors.warning }]}>ضمانت</Text>
                </Pressable>

                <Text style={styles.inputLabel}>چه کسی</Text>
                <TextInput
                  style={[styles.input, styles.rtlInput]}
                  value={forWhom}
                  onChangeText={setForWhom}
                  placeholder="نام شخص"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>رنگ</Text>
                <View style={styles.colorRow}>
                  <Pressable
                    onPress={() => setMarkColor(null)}
                    style={[styles.colorSwatch, styles.colorNone, !markColor && styles.colorSwatchOn]}
                    accessibilityLabel="بدون رنگ"
                  >
                    <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                  </Pressable>
                  {MARK_COLORS.map((hex) => (
                    <Pressable
                      key={hex}
                      onPress={() => setMarkColor(hex)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: hex },
                        markColor === hex && styles.colorSwatchOn,
                      ]}
                      accessibilityLabel={hex}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={() => setPassed((value) => !value)}
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: passed }}
                >
                  <MaterialIcons
                    name={passed ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={passed ? Colors.success : Colors.textMuted}
                  />
                  <Text style={[styles.checkLabel, passed && { color: Colors.success }]}>پاس شد</Text>
                </Pressable>

                <Pressable
                  onPress={() => setReturned((value) => !value)}
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: returned }}
                >
                  <MaterialIcons
                    name={returned ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={returned ? Colors.error : Colors.textMuted}
                  />
                  <Text style={[styles.checkLabel, returned && { color: Colors.error }]}>برگشت خورده</Text>
                </Pressable>
              </View>
            ) : null}

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
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 130,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: 'right',
  },
  extractBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  extractBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  extractBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
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
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  ltrInput: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  rtlInput: {
    textAlign: 'right',
    writingDirection: 'rtl',
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
  moreBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    marginTop: Spacing.xs,
  },
  moreBtnText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  moreBox: {
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 4,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.sm + 4,
    minHeight: 72,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  checkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  checkLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  colorRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorNone: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  colorSwatchOn: {
    borderColor: Colors.textPrimary,
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
