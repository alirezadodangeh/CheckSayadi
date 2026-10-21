import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { useConfirm } from '@/components/ConfirmDialog';
import { useEntries } from '@/hooks/useEntries';
import { exportEntriesFile, parseImportedEntries, pickImportText } from '@/services/backupService';

export default function SettingsScreen() {
  const { entries, replaceEntries } = useEntries();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportEntriesFile(entries);
    } catch {
      Alert.alert('خروجی', 'خروجی لیست گرفته نشد.');
    } finally {
      setBusy(false);
    }
  };

  const applyImport = async (text: string) => {
    const imported = parseImportedEntries(text);
    if (!imported) {
      Alert.alert('ورود', 'این فایل قابل خواندن نیست.');
      return;
    }

    const run = async () => {
      await replaceEntries(imported);
      Alert.alert('ورود', `${imported.length} آیتم وارد شد.`);
    };

    if (entries.length === 0) {
      await run();
      return;
    }

    Alert.alert('ورود لیست', 'لیست فعلی با این فایل جایگزین شود؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'جایگزینی', style: 'destructive', onPress: () => void run() },
    ]);
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const text = await pickImportText();
      if (text != null) await applyImport(text);
    } catch {
      Alert.alert('ورود', 'فایل انتخاب نشد.');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    if (busy || entries.length === 0) return;
    void confirm({
      title: 'حذف همه',
      message: 'همه آیتم‌های لیست حذف شوند؟',
      confirmText: 'حذف',
    }).then((accepted) => {
      if (accepted) void replaceEntries([]);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>تنظیمات</Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.count}>{entries.length} آیتم در لیست</Text>

        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.pressed, busy && styles.disabled]}
          onPress={() => void handleExport()}
          disabled={busy}
        >
          <MaterialIcons name="upload" size={20} color={Colors.primary} />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>خروجی لیست</Text>
            <Text style={styles.actionHint}>کل لیست در یک فایل ذخیره می‌شود</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.pressed, busy && styles.disabled]}
          onPress={() => void handleImport()}
          disabled={busy}
        >
          <MaterialIcons name="download" size={20} color={Colors.primary} />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>ورود لیست</Text>
            <Text style={styles.actionHint}>یک فایل خروجی، لیست را جایگزین می‌کند</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.action,
            styles.danger,
            pressed && styles.pressed,
            (busy || entries.length === 0) && styles.disabled,
          ]}
          onPress={handleClear}
          disabled={busy || entries.length === 0}
        >
          <MaterialIcons name="delete-forever" size={20} color={Colors.error} />
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, styles.dangerTitle]}>حذف همه لیست</Text>
            <Text style={styles.actionHint}>همه چک‌ها یکجا پاک می‌شوند</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  count: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  action: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Shadow.sm,
  },
  danger: {
    marginTop: Spacing.md,
    borderColor: Colors.errorLight,
    backgroundColor: Colors.errorLight,
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  dangerTitle: {
    color: Colors.error,
  },
  actionHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
