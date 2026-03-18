import type { FastifySchema } from 'fastify';

export const ExportTableSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Export table',
  description: 'Exports a table structure and/or data as JSON',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['slug', 'exportType'],
    properties: {
      slug: {
        type: 'string',
        minLength: 1,
        description: 'Slug of the table to export',
        errorMessage: {
          type: 'O slug da tabela deve ser um texto',
          minLength: 'O slug da tabela e obrigatorio',
        },
      },
      exportType: {
        type: 'string',
        enum: ['structure', 'data', 'full'],
        description: 'Type of export: structure, data, or full (both)',
        errorMessage: {
          type: 'O tipo de exportacao deve ser um texto',
          enum: 'Tipo de exportacao deve ser: structure, data ou full',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        slug: 'O slug da tabela e obrigatorio',
        exportType: 'O tipo de exportacao e obrigatorio',
      },
      additionalProperties: 'Campos extras nao sao permitidos',
    },
  },
  response: {
    200: {
      description: 'Table exported successfully',
      type: 'object',
      additionalProperties: true,
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
    404: {
      description: 'Table not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
      },
    },
  },
};
