/* eslint-disable import/order */
import type { ControllersListConfig } from 'fastify-decorators/interfaces/bootstrap-config';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadControllers(): Promise<
  ControllersListConfig['controllers']
> {
  const controllers: ControllersListConfig['controllers'] = [];
  const controllersPath = join(process.cwd(), 'application/resources');
  const files = await readdir(controllersPath, { recursive: true });

  const controllerFiles = files
    .filter(
      (file) =>
        file.endsWith('.controller.ts') || file.endsWith('.controller.js'),
    )
    .sort((a, b) => a.localeCompare(b));

  for await (const file of controllerFiles) {
    const module = await import(join(controllersPath, file));

    // if (['development', 'test'].includes(Env.NODE_ENV))
    console.info('✅ Controller '.concat(file).concat(' loaded'));

    controllers.push(module.default);
  }

  // if (['development', 'test'].includes(Env.NODE_ENV))
  console.info(
    '✅ '.concat(controllers.length.toString()).concat(' controllers loaded'),
  );

  return controllers;
}
