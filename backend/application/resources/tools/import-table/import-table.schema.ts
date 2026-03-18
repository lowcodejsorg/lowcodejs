import type { FastifySchema } from 'fastify';

export const ImportTableSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Import table',
  description: 'Imports a table from a previously exported JSON',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'fileContent'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Name of the new table',
      },
      fileContent: {
        type: 'object',
        description: 'The exported JSON content',
        additionalProperties: true,
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      description: 'Table imported successfully',
      type: 'object',
      properties: {
        tableId: { type: 'string' },
        slug: { type: 'string' },
        importedFields: { type: 'number' },
        importedRows: { type: 'number' },
      },
    },
    400: {
      description: 'Bad request',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
  },
};
