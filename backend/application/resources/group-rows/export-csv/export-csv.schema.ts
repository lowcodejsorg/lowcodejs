import type { FastifySchema } from 'fastify';

export const GroupRowExportCsvSchema: FastifySchema = {
  tags: ['Group Rows'],
  summary: 'Exporta itens de um grupo embutido em uma row em CSV',
  description:
    'Gera um arquivo CSV com os itens de um campo FIELD_GROUP. Restrito a MASTER e ADMINISTRATOR.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    properties: {
      slug: { type: 'string' },
      rowId: { type: 'string' },
      groupSlug: { type: 'string' },
    },
    required: ['slug', 'rowId', 'groupSlug'],
  },
  response: {
    200: { description: 'Arquivo CSV', type: 'string', format: 'binary' },
    401: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string' },
        errors: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    403: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: { type: 'string' },
        errors: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'GROUP_NOT_FOUND', 'ROW_NOT_FOUND'],
        },
        errors: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    422: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [422] },
        cause: { type: 'string', enum: ['EXPORT_LIMIT_EXCEEDED'] },
        errors: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
    500: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['EXPORT_GROUP_ROW_CSV_ERROR'] },
        errors: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
  },
};
