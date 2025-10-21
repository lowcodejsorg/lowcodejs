import mongoose from 'mongoose';
import { cpus } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_WORKERS = Math.min(cpus().length, 8);
const BATCH_SIZE = 5000;
const MAX = 100_000;

interface WorkerData {
  startBatch: number;
  endBatch: number;
  batchSize: number;
  maxItems: number;
  slug: string;
  mongoUri: string;
}

export default async function Seed(): Promise<void> {
  const slug = 'professor-100K';
  const model = mongoose.model(slug);
  // ✅ deleteMany() com otimizações para performance
  await model.deleteMany(
    {},
    {
      // Otimizações de escrita
      writeConcern: { w: 0, j: false }, // Sem confirmação de escrita
      maxTimeMS: 300000, // 5 minutos de timeout
    },
  );

  const workers: Promise<void>[] = [];
  const totalBatches = Math.ceil(MAX / BATCH_SIZE);
  const batchesPerWorker = Math.ceil(totalBatches / NUM_WORKERS);

  let completedBatches = 0;
  const startTime = Date.now();

  // Criar workers
  for (let i = 0; i < NUM_WORKERS; i++) {
    const startBatch = i * batchesPerWorker;
    const endBatch = Math.min((i + 1) * batchesPerWorker, totalBatches);

    if (startBatch >= totalBatches) break;

    // ✅ Usar arquivo worker separado
    const workerPath = path.join(__dirname, 'worker.mts');

    const worker = new Worker(workerPath, {
      workerData: {
        startBatch,
        endBatch,
        batchSize: BATCH_SIZE,
        maxItems: MAX,
        slug,
        mongoUri:
          process.env.DATABASE_URL || 'mongodb://local:local@127.0.0.1:27017',
      } as WorkerData,
    });

    worker.on('message', (data: { type: string; batch?: number }) => {
      if (data.type === 'progress') {
        completedBatches++;
        const progress = completedBatches * BATCH_SIZE;
        const percent = ((progress / MAX) * 100).toFixed(1);
        const elapsed = Date.now() - startTime;
        const rate = ((progress / elapsed) * 1000).toFixed(0);

        console.info(
          `🌱 \x1b[32m ${progress}/${MAX} (${percent}%) - ${rate} docs/s => [${slug}]\x1b[0m`,
        );
      }
    });

    worker.on('error', (error) => {
      console.error(`❌ Worker ${i} error:`, error);
    });

    worker.on('exit', (code) => {});

    workers.push(
      new Promise<void>((resolve, reject) => {
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker finished ${code}`));
          } else {
            resolve();
          }
        });
      }),
    );
  }

  // Aguardar todos os workers terminarem
  await Promise.all(workers);

  const totalTime = (Date.now() - startTime) / 1000;
  const avgRate = (MAX / totalTime).toFixed(0);

  console.info(
    `🌱 \x1b[32m professor 100K (populate) - ${totalTime}s - ${avgRate} docs/s \x1b[0m`,
  );
}
