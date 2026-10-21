// Powered by OnSpace.AI
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Entry, ExtractedData } from '@/services/extractionService';
import { dateToSortKey } from '@/services/extractionService';
import { loadEntries, saveEntries } from '@/services/storageService';

type EntriesContextValue = {
  entries: Entry[];
  loading: boolean;
  addEntry: (data: ExtractedData) => Promise<Entry>;
  updateEntry: (id: string, changes: Partial<Omit<Entry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  replaceEntries: (next: Entry[]) => Promise<void>;
};

export const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef(entries);
  const hydrated = useRef(false);
  entriesRef.current = entries;

  const commit = useCallback(async (next: Entry[]) => {
    hydrated.current = true;
    entriesRef.current = next;
    setEntries(next);
    setLoading(false);
    await saveEntries(next);
  }, []);

  useEffect(() => {
    let active = true;
    loadEntries().then((stored) => {
      if (!active || hydrated.current) return;
      hydrated.current = true;
      entriesRef.current = stored;
      setEntries(stored);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const addEntry = useCallback(async (data: ExtractedData) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      ...data,
      createdAt: Date.now(),
    };
    await commit([...entriesRef.current, newEntry]);
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

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => {
    const aKey = a.date ? dateToSortKey(a.date) : 0;
    const bKey = b.date ? dateToSortKey(b.date) : 0;
    if (bKey !== aKey) return bKey - aKey;
    return b.createdAt - a.createdAt;
  }), [entries]);

  return (
    <EntriesContext.Provider value={{ entries: sortedEntries, loading, addEntry, updateEntry, deleteEntry, replaceEntries }}>
      {children}
    </EntriesContext.Provider>
  );
}
