import type { FastifySchema } from 'fastify';

const errorBlock = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'number' },
    cause: { type: 'string' },
    errors: { type: 'object', additionalProperties: { type: 'string' } },
  },
} as const;

export const StorageMigrationStartSchema: FastifySchema = {
  tags: ['Migração de Storage'],
  summary: 'Inicia migração de arquivos entre drivers',
  description:
    'Enfileira um job de background que copia todos os arquivos do driver antigo para o atual. Restrito ao usuário MASTER.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    properties: {
      concurrency: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        description: 'Número de arquivos copiados em paralelo',
      },
      retry_failed_only: {
        type: 'boolean',
        description:
          'Quando true, processa apenas arquivos com migration_status=failed',
      },
    },
    additionalProperties: false,
  },
  response: {
    202: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            job_id: { type: 'string' },
            queued_count: { type: 'number' },
          },
        },
      },
    },
    400: errorBlock,
    401: errorBlock,
    403: errorBlock,
    409: errorBlock,
  },
};
