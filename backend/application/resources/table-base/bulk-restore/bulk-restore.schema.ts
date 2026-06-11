import type { FastifySchema } from 'fastify';

export const BulkRestoreSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Restaurar tabelas da lixeira em lote',
  description:
    'Restaura múltiplas tabelas da lixeira (trashed=false, trashedAt=null). Tabelas cujo slug já está em uso por uma tabela ativa são puladas e retornadas em "skipped".',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        description: 'Array of table IDs to restore from trash',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Tables restored from trash successfully',
      type: 'object',
      properties: {
        modified: {
          type: 'number',
          description: 'Number of tables restored from trash',
        },
        skipped: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Slugs of tables not restored because an active table already uses the same slug',
        },
      },
    },
    401: {
      description: 'Não autenticado - Autenticação necessária',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: {
          type: 'string',
          enum: ['AUTHENTICATION_REQUIRED', 'USER_NOT_AUTHENTICATED'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    403: {
      description: 'Acesso negado - Permissão insuficiente',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: {
          type: 'string',
          enum: [
            'USER_NOT_FOUND',
            'USER_NOT_ACTIVE',
            'PERMISSIONS_NOT_FOUND',
            'INSUFFICIENT_PERMISSIONS',
          ],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['BULK_RESTORE_TABLES_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
