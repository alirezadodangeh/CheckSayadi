// Powered by OnSpace.AI
import { useContext } from 'react';
import { EntriesContext } from '@/contexts/EntriesContext';

export type { Entry } from '@/services/extractionService';

export function useEntries() {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntries must be used within EntriesProvider');
  }
  return context;
}
