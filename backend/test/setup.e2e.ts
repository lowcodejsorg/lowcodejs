import 'reflect-metadata';

import { config } from 'dotenv';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll } from 'vitest';

config({ path: '.env.test', override: true });

const testDbName = `test_${randomUUID().replace(/-/g, '_')}`;

beforeAll(async () => {
  await mongoose.connect(process.env.DATABASE_URL!, {
    dbName: testDbName,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
