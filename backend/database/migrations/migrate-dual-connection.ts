/**
 * Migration: Move dynamic collections from system DB to data DB.
 *
 * Usage:
 *   npx tsx database/migrations/migrate-dual-connection.ts
 *   npx tsx database/migrations/migrate-dual-connection.ts --drop-source
 *
 * Environment variables required:
 *   DATABASE_URL  - MongoDB connection string
 *   DB_DATABASE   - System database name (source)
 *   DB_DATA_DATABASE - Data database name (target)
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_DATABASE = process.env.DB_DATABASE || 'lowcodejs';
const DB_DATA_DATABASE = process.env.DB_DATA_DATABASE || 'lowcodejs_data';
const DROP_SOURCE = process.argv.includes('--drop-source');

function isMongoDuplicateKeyError(e: unknown): e is Error & { code: number } {
  return e instanceof Error && 'code' in e;
}

async function migrate(): Promise<void> {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.info(`Source DB: ${DB_DATABASE}`);
  console.info(`Target DB: ${DB_DATA_DATABASE}`);
  console.info(`Drop source: ${DROP_SOURCE}`);
  console.info('---');

  const sourceConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATABASE,
  });
  await sourceConn.asPromise();

  const targetConn = mongoose.createConnection(DATABASE_URL, {
    dbName: DB_DATA_DATABASE,
  });
  await targetConn.asPromise();

  const sourceDb = sourceConn.db!;
  const targetDb = targetConn.db!;

  const tables = await sourceDb
    .collection('tables')
    .find({ trashed: { $ne: true } })
    .project({ slug: 1 })
    .toArray();

  if (tables.length === 0) {
    console.info('No tables found. Nothing to migrate.');
    await sourceConn.close();
    await targetConn.close();
    return;
  }

  console.info(`Found ${tables.length} table(s) to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const table of tables) {
    const slug = table.slug;
    if (!slug) {
      skipped++;
      continue;
    }

    const sourceCollections = await sourceDb
      .listCollections({ name: slug })
      .toArray();

    if (sourceCollections.length === 0) {
      console.info(`  [skip] ${slug} — collection not found in source`);
      skipped++;
      continue;
    }

    const sourceCol = sourceDb.collection(slug);
    const count = await sourceCol.countDocuments();

    if (count === 0) {
      console.info(`  [skip] ${slug} — empty collection`);
      skipped++;
      continue;
    }

    const docs = await sourceCol.find().toArray();
    const targetCol = targetDb.collection(slug);

    try {
      await targetCol.insertMany(docs, { ordered: false });
    } catch (error: unknown) {
      if (isMongoDuplicateKeyError(error) && error.code === 11000) {
        console.info(
          `  [partial] ${slug} — some duplicates skipped (${count} docs)`,
        );
      } else {
        console.error(`  [error] ${slug} — ${error}`);
        continue;
      }
    }

    console.info(`  [ok] ${slug} — ${count} document(s) migrated`);
    migrated++;

    if (DROP_SOURCE) {
      await sourceDb.dropCollection(slug);
      console.info(`  [drop] ${slug} — removed from source`);
    }
  }

  console.info('---');
  console.info(
    `Done. Migrated: ${migrated}, Skipped: ${skipped}, Total: ${tables.length}`,
  );

  await sourceConn.close();
  await targetConn.close();
}

migrate().catch((error: unknown): void => {
  console.error('Migration failed:', error);
  process.exit(1);
});
