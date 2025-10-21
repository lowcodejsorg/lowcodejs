import { MongooseConnect } from '@config/database.config';
import { glob } from 'glob';

async function seed(): Promise<void> {
  await MongooseConnect();
  let seeders = await glob('./database/seeders/*.seed.{mts,ts}');

  seeders = seeders.sort((a, b) => {
    return a.localeCompare(b);
  });

  console.info('🌱 Seeding...\n');

  for (const seeder of seeders) {
    const { default: main } = await import(seeder);
    await main();
  }

  console.info('\n✅ Seeding complete!');
  process.exit(0);
}

if (require.main === module) {
  seed();
}
