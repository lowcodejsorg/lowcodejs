import type { ISetting } from '@application/core/entity.core';

export function syncStorageEnv(setting: ISetting): void {
  process.env.STORAGE_DRIVER = setting.STORAGE_DRIVER ?? 'local';
  process.env.STORAGE_ENDPOINT = setting.STORAGE_ENDPOINT ?? '';
  process.env.STORAGE_REGION = setting.STORAGE_REGION ?? 'us-east-1';
  process.env.STORAGE_BUCKET = setting.STORAGE_BUCKET ?? '';
  process.env.STORAGE_ACCESS_KEY = setting.STORAGE_ACCESS_KEY ?? '';
  process.env.STORAGE_SECRET_KEY = setting.STORAGE_SECRET_KEY ?? '';
}
