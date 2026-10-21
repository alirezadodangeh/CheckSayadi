// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { EntriesProvider } from '@/contexts/EntriesContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <EntriesProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
        </EntriesProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
