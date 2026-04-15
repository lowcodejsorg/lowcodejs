import type { IStorage } from '@/lib/interfaces';

export function getStorageInlineUrl(storage: Pick<IStorage, 'url'>): string {
  return storage.url;
}

export function getStorageDownloadUrl(storage: Pick<IStorage, 'url'>): string {
  if (storage.url.includes('?')) {
    return `${storage.url}&download=1`;
  }
  return `${storage.url}?download=1`;
}
