import { glob } from 'glob';

import { MongooseConnect } from '@config/database.config';

async function seed(): Promise<void> {
  await MongooseConnect();
  let seeders = await glob(process.cwd() + '/database/seeders/*.seed.{js,ts}');

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
