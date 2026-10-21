// Powered by OnSpace.AI
import { useState, useEffect, useCallback } from 'react';
import type { Entry, ExtractedData } from '@/services/extractionService';
import { dateToSortKey } from '@/services/extractionService';
import { loadEntries, saveEntries } from '@/services/storageService';

export type { Entry };

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries().then((stored) => {
      setEntries(stored);
      setLoading(false);
    });
  }, []);

  const addEntry = useCallback(async (data: ExtractedData) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      ...data,
      createdAt: Date.now(),
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    await saveEntries(updated);
    return newEntry;
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    await saveEntries(updated);
  }, [entries]);

  const updateEntry = useCallback(async (id: string, changes: Partial<Omit<Entry, 'id' | 'createdAt'>>) => {
    const updated = entries.map((e) =>
      e.id === id ? { ...e, ...changes } : e
    );
    setEntries(updated);
    await saveEntries(updated);
  }, [entries]);

  const sortedEntries = [...entries].sort((a, b) => {
    const aKey = a.date ? dateToSortKey(a.date) : 0;
    const bKey = b.date ? dateToSortKey(b.date) : 0;
    if (bKey !== aKey) return bKey - aKey;
    return b.createdAt - a.createdAt;
  });

  return {
    entries: sortedEntries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
