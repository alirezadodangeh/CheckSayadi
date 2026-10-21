import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (accepted: boolean) => void;
};

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const ask = useCallback((options: ConfirmOptions) => {
    pendingRef.current?.resolve(false);
    return new Promise<boolean>((resolve) => {
      const next = { ...options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const close = (accepted: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(accepted);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => close(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => close(false)} />
          <View style={styles.card}>
            <Text style={styles.title}>{pending?.title}</Text>
            <Text style={styles.message}>{pending?.message}</Text>
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                onPress={() => close(false)}
              >
                <Text style={styles.cancelText}>انصراف</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                onPress={() => close(true)}
              >
                <Text style={styles.confirmText}>{pending?.confirmText ?? 'حذف'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: 12,
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  pressed: {
    opacity: 0.8,
  },
});
