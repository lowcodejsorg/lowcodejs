import type { FastifySchema } from 'fastify';

export const MenuReorderSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Reordenar itens de menu',
  description:
    'Atualiza a ordem de múltiplos itens de menu que compartilham o mesmo pai',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['_id', 'order'],
          properties: {
            _id: {
              type: 'string',
              minLength: 1,
              description: 'ID do item de menu',
            },
            order: {
              type: 'integer',
              minimum: 0,
              description: 'Nova posição do item',
            },
          },
        },
      },
    },
  },
  response: {
    200: {
      description: 'Itens reordenados com sucesso',
      type: 'null',
    },
    400: {
      description: 'Requisição inválida',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string' },
      },
    },
    401: {
      description: 'Não autorizado',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string' },
      },
    },
    404: {
      description: 'Menu não encontrado',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string' },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string' },
      },
    },
  },
};
