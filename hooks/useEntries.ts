// Powered by OnSpace.AI
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Entry, ExtractedData } from '@/services/extractionService';
import { dateToSortKey } from '@/services/extractionService';
import { loadEntries, saveEntries } from '@/services/storageService';

export type { Entry };

type EntriesContextValue = {
  entries: Entry[];
  loading: boolean;
  addEntry: (data: ExtractedData) => Promise<Entry>;
  updateEntry: (id: string, changes: Partial<Omit<Entry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  replaceEntries: (next: Entry[]) => Promise<void>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef(entries);
  const hydrated = useRef(false);
  entriesRef.current = entries;

  const commit = useCallback(async (next: Entry[]) => {
    hydrated.current = true;
    entriesRef.current = next;
    setEntries(next);
    await saveEntries(next);
  }, []);

  useEffect(() => {
    loadEntries().then((stored) => {
      if (hydrated.current) return;
      hydrated.current = true;
      entriesRef.current = stored;
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
    const updated = [...entriesRef.current, newEntry];
    await commit(updated);
    return newEntry;
  }, [commit]);

  const deleteEntry = useCallback(async (id: string) => {
    await commit(entriesRef.current.filter((entry) => entry.id !== id));
  }, [commit]);

  const updateEntry = useCallback(async (id: string, changes: Partial<Omit<Entry, 'id' | 'createdAt'>>) => {
    await commit(entriesRef.current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));
  }, [commit]);

  const replaceEntries = useCallback(async (next: Entry[]) => {
    await commit(next);
  }, [commit]);

  const sortedEntries = [...entries].sort((a, b) => {
    const aKey = a.date ? dateToSortKey(a.date) : 0;
    const bKey = b.date ? dateToSortKey(b.date) : 0;
    if (bKey !== aKey) return bKey - aKey;
    return b.createdAt - a.createdAt;
  });

  return React.createElement(
    EntriesContext.Provider,
    {
      value: {
        entries: sortedEntries,
        loading,
        addEntry,
        updateEntry,
        deleteEntry,
        replaceEntries,
      },
    },
    children,
  );
}

export function useEntries() {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntries must be used within EntriesProvider');
  }
  return context;
}
