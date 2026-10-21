// Powered by OnSpace.AI
import React, { useState, useRef, useEffect } from 'react';
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
import { extractData, ExtractedData, formatAmount, sanitizeNationalCode, toEnglishNumeric } from '@/services/extractionService';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ExtractedData) => void;
}

interface FieldConfig {
  key: keyof Omit<ExtractedData, 'rawText'>;
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
    label: 'عنوان',
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

export default function AddEntryModal({ visible, onClose, onSave }: Props) {
  const [text, setText] = useState('');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [isLegal, setIsLegal] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (extracted) {
      const form: Record<string, string> = {};
      FIELDS.forEach((f) => {
        const value = (extracted[f.key] as string | null) ?? '';
        form[f.key] = f.key === 'amount' ? formatAmount(value) : value;
      });
      setEditForm(form);
    }
  }, [extracted]);

  const handleExtract = () => {
    if (!text.trim()) return;
    setProcessing(true);
    setTimeout(() => {
      const result = extractData(text.trim(), { legal: isLegal });
      setExtracted(result);
      setProcessing(false);
    }, 300);
  };

  const handleSave = () => {
    if (!extracted) return;
    const finalData: ExtractedData = {
      rawText: extracted.rawText,
      date: toEnglishNumeric(editForm['date'] ?? '').trim() || null,
      checkSerial: toEnglishNumeric(editForm['checkSerial'] ?? '').trim() || null,
      amount: formatAmount(editForm['amount'] ?? '') || null,
      sayyadId: toEnglishNumeric(editForm['sayyadId'] ?? '').trim() || null,
      name: editForm['name']?.trim() || null,
      nationalCode: sanitizeNationalCode(editForm['nationalCode'] ?? '', isLegal) || null,
      isLegal,
    };
    onSave(finalData);
    handleClose();
  };

  const handleClose = () => {
    setText('');
    setExtracted(null);
    setEditForm({});
    setProcessing(false);
    setIsLegal(false);
    setDatePickerOpen(false);
    onClose();
  };

  const applyLegal = (next: boolean) => {
    setIsLegal(next);
    setEditForm((form) => {
      const fromText = text.trim() ? extractData(text.trim(), { legal: next }).nationalCode : null;
      if (fromText) return { ...form, nationalCode: fromText };
      return { ...form, nationalCode: sanitizeNationalCode(form.nationalCode ?? '', next) };
    });
  };

  const onNationalChange = (value: string) => {
    const digits = sanitizeNationalCode(value, true);
    if (!isLegal && digits.length > 10) {
      setIsLegal(true);
      setEditForm((prev) => ({ ...prev, nationalCode: digits }));
      return;
    }
    setEditForm((prev) => ({
      ...prev,
      nationalCode: sanitizeNationalCode(value, isLegal),
    }));
  };

  const foundCount = FIELDS.filter((f) => !!editForm[f.key]?.trim()).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {datePickerOpen ? 'انتخاب تاریخ شمسی' : 'افزودن آیتم جدید'}
            </Text>
            <Pressable
              onPress={datePickerOpen ? () => setDatePickerOpen(false) : handleClose}
              hitSlop={8}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
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
              value={editForm['date'] ?? ''}
              onConfirm={(date) => {
                setEditForm((prev) => ({ ...prev, date }));
                setDatePickerOpen(false);
              }}
              onClear={() => {
                setEditForm((prev) => ({ ...prev, date: '' }));
                setDatePickerOpen(false);
              }}
            />
          ) : (
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Text Input Area */}
            <Text style={styles.inputLabel}>متن را وارد کنید</Text>
            <TextInput
              ref={inputRef}
              style={styles.textArea}
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (extracted) {
                  setExtracted(null);
                  setEditForm({});
                }
              }}
              placeholder="متن شامل تاریخ، مبلغ، شناسه صیاد، سریال چک و... را اینجا بنویسید یا بچسبانید"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={6}
              textAlign="right"
              textAlignVertical="top"
              returnKeyType="default"
            />

            {/* Extract Button */}
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

            {/* Editable Preview */}
            {extracted ? (
              <View style={styles.preview}>
                {/* Preview Header */}
                <View style={styles.previewHeader}>
                  <View
                    style={[
                      styles.foundBadge,
                      {
                        backgroundColor:
                          foundCount > 0 ? Colors.successLight : Colors.errorLight,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={foundCount > 0 ? 'check-circle' : 'info'}
                      size={14}
                      color={foundCount > 0 ? Colors.success : Colors.error}
                    />
                    <Text
                      style={[
                        styles.foundText,
                        { color: foundCount > 0 ? Colors.success : Colors.error },
                      ]}
                    >
                      {foundCount > 0 ? `${foundCount} فیلد یافت شد` : 'فیلدی یافت نشد'}
                    </Text>
                  </View>
                  <View style={styles.previewTitleRow}>
                    <MaterialIcons name="edit-note" size={16} color={Colors.textSecondary} />
                    <Text style={styles.previewTitle}>ویرایش و ذخیره</Text>
                  </View>
                </View>

                {/* Editable Fields */}
                {FIELDS.map((field) => {
                  const hasValue = !!editForm[field.key]?.trim();
                  const label =
                    field.key === 'nationalCode'
                      ? isLegal
                        ? 'شناسه ملی (۱۱ رقم)'
                        : 'کد ملی (۱۰ رقم)'
                      : field.label;
                  const inputStyle = [
                    styles.fieldInput,
                    hasValue
                      ? {
                          borderColor: field.color + '66',
                          backgroundColor: field.bg,
                          color: field.color,
                        }
                      : {
                          borderColor: Colors.border,
                          backgroundColor: Colors.background,
                          color: Colors.textMuted,
                        },
                  ];
                  return (
                    <View key={field.key} style={styles.fieldWrap}>
                      <View style={styles.fieldLabelRow}>
                        {field.key === 'checkSerial' ? (
                          <MaterialCommunityIcons
                            name="bank-check"
                            size={14}
                            color={hasValue ? field.color : Colors.textMuted}
                          />
                        ) : (
                          <MaterialIcons
                            name={field.icon}
                            size={14}
                            color={hasValue ? field.color : Colors.textMuted}
                          />
                        )}
                        <Text
                          style={[
                            styles.fieldLabel,
                            field.key === 'name' ? styles.rtlInput : styles.ltrInput,
                            { color: hasValue ? field.color : Colors.textMuted },
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
                            <Text
                              style={[
                                styles.legalToggleText,
                                { color: isLegal ? field.color : Colors.textMuted },
                              ]}
                            >
                              حقوقی
                            </Text>
                            <MaterialIcons
                              name={isLegal ? 'check-box' : 'check-box-outline-blank'}
                              size={18}
                              color={isLegal ? field.color : Colors.textMuted}
                            />
                          </Pressable>
                        ) : hasValue ? (
                          <MaterialIcons
                            name="check-circle"
                            size={13}
                            color={field.color}
                            style={styles.fieldCheck}
                          />
                        ) : null}
                      </View>
                      {field.key === 'date' ? (
                        <Pressable
                          onPress={() => setDatePickerOpen(true)}
                          style={[inputStyle, styles.dateField]}
                        >
                          <MaterialIcons
                            name="calendar-today"
                            size={16}
                            color={hasValue ? field.color : Colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.dateFieldText,
                              hasValue ? styles.ltrInput : styles.rtlInput,
                              { color: hasValue ? field.color : Colors.textMuted },
                            ]}
                          >
                            {hasValue ? toEnglishNumeric(editForm[field.key] ?? '') : 'برای تنظیم تاریخ بزنید'}
                          </Text>
                        </Pressable>
                      ) : (
                        <TextInput
                          value={editForm[field.key] ?? ''}
                          onChangeText={
                            field.key === 'nationalCode'
                              ? onNationalChange
                              : (v) =>
                                  setEditForm((prev) => ({
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
                            field.key === 'nationalCode'
                              ? isLegal
                                ? '12345678901'
                                : field.placeholder
                              : field.placeholder
                          }
                          placeholderTextColor={Colors.textMuted}
                          textAlign={field.key === 'name' ? 'right' : 'left'}
                          style={[inputStyle, field.key === 'name' ? styles.rtlInput : styles.ltrInput]}
                          keyboardType={field.keyboardType ?? 'default'}
                          maxLength={field.key === 'nationalCode' ? (isLegal ? 11 : 10) : undefined}
                          returnKeyType="next"
                        />
                      )}
                    </View>
                  );
                })}

                {/* Save Button */}
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleSave}
                >
                  <MaterialIcons name="save-alt" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>ذخیره در لیست</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={{ height: 48 }} />
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
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
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
    marginTop: Spacing.sm + 4,
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
  // Preview section
  preview: {
    marginTop: Spacing.md,
    gap: Spacing.xs + 2,
  },
  previewHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  previewTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  previewTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  foundBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  foundText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  // Editable field
  fieldWrap: {
    gap: 5,
  },
  fieldLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  fieldCheck: {
    marginLeft: 2,
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
    fontSize: FontSize.sm,
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
  fieldInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  // Save
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.success,
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
