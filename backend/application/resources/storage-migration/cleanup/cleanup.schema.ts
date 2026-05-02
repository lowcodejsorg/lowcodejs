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

export const StorageMigrationCleanupSchema: FastifySchema = {
  tags: ['Migração de Storage'],
  summary: 'Limpa arquivos do driver antigo após migração',
  description:
    'Apaga fisicamente os arquivos que ficaram no driver antigo após a migração. Restrito ao MASTER.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    properties: {
      confirm: { type: 'boolean' },
    },
    required: ['confirm'],
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
