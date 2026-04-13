import 'reflect-metadata';

import { config } from 'dotenv';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll } from 'vitest';

import { setDataConnection } from '@config/database.config';

config({ path: '.env.test', override: true });

const testId = randomUUID().replace(/-/g, '_');
const testSystemDb = `test_system_${testId}`;
const testDataDb = `test_data_${testId}`;

let dataConn: mongoose.Connection;

beforeAll(async () => {
  await mongoose.connect(process.env.DATABASE_URL!, {
    dbName: testSystemDb,
  });

  dataConn = mongoose.createConnection(process.env.DATABASE_URL!, {
    dbName: testDataDb,
  });
  await dataConn.asPromise();
  setDataConnection(dataConn);
});

afterAll(async () => {
  if (dataConn) {
    await dataConn.db?.dropDatabase();
    await dataConn.close();
  }
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
