import type { FastifySchema } from 'fastify';

export const ExportTableSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Export table',
  description:
    'Exports one or more table structures and/or data as JSON (multi-table format v2)',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['exportType'],
    properties: {
      slug: {
        type: 'string',
        minLength: 1,
        description:
          'Single-table slug (legacy/compat). Use "slugs" for multi-table export.',
      },
      slugs: {
        type: 'array',
        items: { type: 'string', minLength: 1 },
        minItems: 1,
        description: 'Slugs of the tables to export. Preferred over "slug".',
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
      acknowledgeMissingRelationships: {
        type: 'boolean',
        description:
          'When true, allows export to proceed even when relationship fields point to tables outside the selection (those values will be dropped on import).',
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
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
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    404: {
      description: 'Table not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: { type: 'string' },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
