import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Entry } from '@/services/extractionService';

const MARK_COLOR = /^#[0-9A-Fa-f]{6}$/;

function asNullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function parseImportedEntries(text: string): Entry[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { entries?: unknown }).entries)
      ? (data as { entries: unknown[] }).entries
      : null;
  if (!list) return null;

  const seen = new Set<string>();
  const entries: Entry[] = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;
    let id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `import-${Date.now()}-${index}`;
    while (seen.has(id)) id = `${id}-${index}`;
    seen.add(id);

    const color = typeof row.color === 'string' && MARK_COLOR.test(row.color) ? row.color : null;
    entries.push({
      id,
      date: asNullableString(row.date),
      amount: asNullableString(row.amount),
      sayyadId: asNullableString(row.sayyadId),
      name: asNullableString(row.name),
      nationalCode: asNullableString(row.nationalCode),
      checkSerial: asNullableString(row.checkSerial),
      rawText: typeof row.rawText === 'string' ? row.rawText : '',
      createdAt: typeof row.createdAt === 'number' && Number.isFinite(row.createdAt) ? row.createdAt : Date.now(),
      description: asNullableString(row.description),
      forWhom: asNullableString(row.forWhom),
      color,
      isLegal: asBool(row.isLegal),
      guarantee: asBool(row.guarantee),
      passed: asBool(row.passed),
      returned: asBool(row.returned),
    });
  });

  if (list.length > 0 && entries.length === 0) return null;
  return entries;
}

function exportFilename(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `checksayadi-${stamp}.json`;
}

function exportPayload(entries: Entry[]): string {
  return JSON.stringify(
    {
      app: 'checksayadi',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
    },
    null,
    2,
  );
}

function downloadOnWeb(filename: string, json: string) {
  const documentRef = (
    globalThis as {
      document?: {
        createElement: (tag: string) => { href: string; download: string; click: () => void };
      };
      URL: { createObjectURL: (blob: Blob) => string; revokeObjectURL: (url: string) => void };
    }
  ).document;
  const urlApi = (globalThis as { URL: { createObjectURL: (blob: Blob) => string; revokeObjectURL: (url: string) => void } }).URL;
  if (!documentRef || !urlApi) throw new Error('download unavailable');
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = urlApi.createObjectURL(blob);
  const anchor = documentRef.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  urlApi.revokeObjectURL(url);
}

export async function exportEntriesFile(entries: Entry[]): Promise<void> {
  const json = exportPayload(entries);
  const filename = exportFilename();

  if (Platform.OS === 'web') {
    downloadOnWeb(filename, json);
    return;
  }

  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new Error('storage unavailable');
  const uri = `${directory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('share unavailable');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'خروجی لیست',
    UTI: 'public.json',
  });
}

export async function pickImportText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'text/json'],
    copyToCacheDirectory: true,
    base64: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  if (asset.file) return asset.file.text();
  return FileSystem.readAsStringAsync(asset.uri);
}
