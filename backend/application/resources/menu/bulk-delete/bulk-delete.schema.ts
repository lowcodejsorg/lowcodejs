import type { FastifySchema } from 'fastify';

export const MenuBulkDeleteSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Excluir permanentemente múltiplos menus',
  description:
    'Remove permanentemente múltiplos menus que já estejam na lixeira.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        description: 'IDs dos menus a excluir permanentemente',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Menus excluídos permanentemente com sucesso',
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Quantidade de menus excluídos permanentemente',
        },
      },
    },
    401: {
      description: 'Não autorizado',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    403: {
      description: 'Permissão insuficiente',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: { type: 'string', enum: ['FORBIDDEN'] },
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
        cause: { type: 'string', enum: ['BULK_DELETE_MENUS_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
