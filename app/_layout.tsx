// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { EntriesProvider } from '@/hooks/useEntries';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ConfirmProvider>
        <EntriesProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings" />
          </Stack>
        </EntriesProvider>
      </ConfirmProvider>
    </SafeAreaProvider>
  );
}
