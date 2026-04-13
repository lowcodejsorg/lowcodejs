import { getDataConnection } from '@config/database.config';

/**
 * Removes all dynamic collections (tables created by the low-code platform)
 * from the data database. Used in E2E test cleanup.
 *
 * @param prefix - Only drop collections starting with this prefix. Defaults to 'table_'.
 */
export async function cleanDynamicCollections(
  prefix: string = 'table_',
): Promise<void> {
  const dataDb = getDataConnection().db;
  const collections = await dataDb?.listCollections().toArray();

  for (const collection of collections || []) {
    if (collection.name.startsWith(prefix)) {
      await dataDb?.dropCollection(collection.name);
    }
  }
}

/**
 * Drops specific dynamic collections by their slugs.
 * Used when you know exactly which collections to clean.
 */
export async function dropDynamicCollections(
  slugs: string[],
): Promise<void> {
  const conn = getDataConnection();
  const db = conn.db!;

  for (const slug of slugs) {
    const exists = await db.listCollections({ name: slug }).toArray();
    if (exists.length > 0) {
      await db.dropCollection(slug);
    }
    if (conn.models[slug]) {
      conn.deleteModel(slug);
    }
  }
}
