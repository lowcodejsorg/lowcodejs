import 'reflect-metadata';

import { config } from 'dotenv';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll } from 'vitest';

config({ path: '.env.test', override: true });

const testDbName = `test_${randomUUID().replace(/-/g, '_')}`;

beforeAll(async () => {
  console.log(
    `🔄 MongoDB test database: ${testDbName}, ${process.env.DATABASE_URL}`,
  );
  await mongoose.connect(process.env.DATABASE_URL!, {
    dbName: testDbName,
  });
  console.log(`🔄 MongoDB test database created: ${testDbName}`);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  console.log(`🗑️ MongoDB test database dropped: ${testDbName}`);
  await mongoose.connection.close();
});
