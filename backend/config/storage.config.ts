/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { DriveManager } from 'flydrive';
import { FSDriver } from 'flydrive/drivers/fs';
import { S3Driver } from 'flydrive/drivers/s3';
import { join } from 'node:path';

import { Env } from '@start/env';

const APP_SERVER_URL = Env.APP_SERVER_URL;

export const drive = new DriveManager({
  default: (process.env.STORAGE_DRIVER as 'local' | 's3') || 'local',
  services: {
    local: () =>
      new FSDriver({
        location: join(process.cwd(), '_storage'),
        visibility: 'public',
        urlBuilder: {
          async generateURL(key: string) {
            return APP_SERVER_URL.concat(`/storage/`).concat(key);
          },
          async generateSignedURL(key: string) {
            return APP_SERVER_URL.concat(`/storage/`).concat(key);
          },
        },
      }),
    s3: () =>
      new S3Driver({
        credentials: {
          accessKeyId: process.env.STORAGE_ACCESS_KEY!,
          secretAccessKey: process.env.STORAGE_SECRET_KEY!,
        },
        region: process.env.STORAGE_REGION || 'us-east-1',
        bucket: process.env.STORAGE_BUCKET!,
        endpoint: process.env.STORAGE_ENDPOINT,
        forcePathStyle: true,
        visibility: 'public',
        supportsACL: false,
      }),
  },
});
