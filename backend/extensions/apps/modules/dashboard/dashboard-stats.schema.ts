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

export const DashboardStatsSchema: FastifySchema = {
  tags: ['Extensões'],
  summary: 'Estatísticas agregadas para o módulo Dashboard',
  description:
    'Retorna contagens, séries temporais e atividades recentes do sistema. Blindado por ExtensionActiveMiddleware (apps/modules/dashboard).',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        totals: {
          type: 'object',
          properties: {
            tables: { type: 'number' },
            users: { type: 'number' },
            records: { type: 'number' },
            activeUsers: { type: 'number' },
          },
        },
        tablesPerMonth: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              tables: { type: 'number' },
            },
          },
        },
        usersByStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              value: { type: 'number' },
              fill: { type: 'string' },
            },
          },
        },
        recentActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: {
                type: 'string',
                enum: ['table_created', 'user_created'],
              },
              description: { type: 'string' },
              time: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    401: errorBlock,
    403: errorBlock,
    404: errorBlock,
    500: errorBlock,
  },
};
