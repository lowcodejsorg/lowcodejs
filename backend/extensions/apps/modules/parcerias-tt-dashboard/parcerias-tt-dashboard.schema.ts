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

export const ParceriasTtDashboardSchema: FastifySchema = {
  tags: ['Extensões'],
  summary: 'Dashboard de parcerias e transferência de tecnologia',
  description:
    'Retorna agregações da tabela demandas-de-parcerias-e-tecnologia por situação e por ano, considerando o período informado.',
  security: [{ cookieAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        totals: {
          type: 'object',
          properties: {
            demands: { type: 'number' },
            withTransfer: { type: 'number' },
            withoutTransfer: { type: 'number' },
          },
        },
        period: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        status: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'number' },
              percent: { type: 'number' },
              fill: { type: 'string' },
            },
          },
        },
        yearly: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              year: { type: 'string' },
              withoutTransfer: { type: 'number' },
              withTransfer: { type: 'number' },
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

export const ParceriasTtDashboardRowsSchema: FastifySchema = {
  tags: ['Extensões'],
  summary: 'Demandas filtradas do dashboard PITT',
  description:
    'Retorna as demandas da tabela demandas-de-parcerias-e-tecnologia filtradas por período, situação, ano ou transferência de tecnologia.',
  security: [{ cookieAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      status: { type: 'string' },
      year: { type: 'number' },
      transfer: { type: 'string', enum: ['withTransfer', 'withoutTransfer'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        total: { type: 'number' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              legacyId: { type: 'string' },
              date: { type: ['string', 'null'], format: 'date-time' },
              title: { type: 'string' },
              status: { type: 'string' },
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
