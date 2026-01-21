import type { FastifySchema } from 'fastify';

export const CloneTableSchema: FastifySchema = {
  tags: ['Tools'],
  summary: 'Clone table',
  description: 'Clones a table using its ID and a new table name',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['baseTableId', 'name'],
    properties: {
      baseTableId: {
        type: 'string',
        minLength: 1,
        description: 'ID of the base table',
        errorMessage: {
          type: 'O ID da tabela base deve ser um texto',
          minLength: 'O ID da tabela base é obrigatório',
        },
      },
      name: {
        type: 'string',
        minLength: 1,
        description: 'Name of the new table',
        errorMessage: {
          type: 'O nome da nova tabela deve ser um texto',
          minLength: 'O nome da nova tabela é obrigatório',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        baseTableId: 'O ID da tabela base é obrigatório',
        name: 'O nome da nova tabela é obrigatório',
      },
      additionalProperties: 'Campos extras não são permitidos',
    },
  },
  response: {
    201: {
      description: 'Table cloned successfully',
      type: 'object',
      properties: {
        tableId: { type: 'string', description: 'New table ID' },
        slug: { type: 'string', description: 'New table slug' },
        fieldIdMap: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Map of old field IDs to new field IDs',
        },
      },
    },
    400: {
      description: 'Bad request - Zod validation failed',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Specific validation error',
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PAYLOAD_FORMAT'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Field-specific validation errors',
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Unauthorized'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    404: {
      description: 'Table not found',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Tabela base não encontrada'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND'] },
      },
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro ao clonar tabela'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['CLONE_TABLE_ERROR'] },
      },
    },
  },
};
