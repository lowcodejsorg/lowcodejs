import { glob } from 'glob';

import { MongooseConnect } from '@config/database.config';

async function seed(): Promise<void> {
  await MongooseConnect();
  const base = process.cwd().replace(/\\/g, '/');
  const [ts, js] = await Promise.all([
    glob(base + '/database/seeders/*.seed.ts'),
    glob(base + '/database/seeders/*.seed.js'),
  ]);
  let seeders = [...ts, ...js];

  seeders = seeders.sort((a, b) => {
    return a.localeCompare(b);
  });

  console.info('🌱 Seeding...\n');

  for (const seeder of seeders) {
    console.info(`🌱 Seeding ${seeder}`);
    const { default: main } = await import(seeder);
    await main();
  }

  console.info('\n✅ Seeding complete!');
  process.exit(0);
}

seed();
