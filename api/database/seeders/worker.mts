import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import { parentPort, workerData } from 'worker_threads';

interface WorkerData {
  startBatch: number;
  endBatch: number;
  batchSize: number;
  maxItems: number;
  slug: string;
  mongoUri: string;
}

interface BatchData {
  name: string;
  'e-mail': string;
  trashed: boolean;
  trashedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

async function runWorker(): Promise<void> {
  const { startBatch, endBatch, batchSize, slug, mongoUri } =
    workerData as WorkerData;

  try {
    // Conectar ao MongoDB no worker
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoCreate: true,
      dbName: 'lowcodejs',
    });

    // @ts-ignore
    const model = mongoose.model(slug, {}, slug);

    // Processar batches
    for (let batchIndex = startBatch; batchIndex < endBatch; batchIndex++) {
      const batch = generateBatchData(batchSize, batchIndex);

      try {
        await model.insertMany(batch, {
          ordered: false,
          lean: true,
        });

        // Notificar progresso
        parentPort?.postMessage({ type: 'progress', batch: batchIndex });
      } catch (error) {
        console.error(`❌ Erro no batch ${batchIndex}:`, error);
        throw error;
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erro fatal no worker:', error);
    process.exit(1);
  }
}

function generateBatchData(batchSize: number, batchIndex: number): BatchData[] {
  const batch: BatchData[] = [];

  // Seed determinística
  faker.seed(batchIndex * 1000);

  for (let i = 0; i < batchSize; i++) {
    const name = faker.person.fullName();
    const uniqueId = batchIndex * batchSize + i;

    // Gerar email único
    const email = faker.internet.email({
      firstName: name.split(' ')[0] + uniqueId,
      lastName: name.split(' ')[1] + uniqueId,
    });

    const shouldTrash = Math.random() < 0.1;

    batch.push({
      name,
      'e-mail': email,
      trashed: shouldTrash,
      trashedAt: shouldTrash ? faker.date.recent({ days: 30 }) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return batch;
}

// Executar o worker
runWorker().catch((error) => {
  console.error('❌ Erro no worker:', error);
  process.exit(1);
});
