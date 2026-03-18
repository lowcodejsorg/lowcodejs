import type { FastifySchema } from 'fastify';

export const MenuRestoreSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Restaurar menu da lixeira',
  description:
    'Restaura um item de menu da lixeira, tornando-o ativo novamente.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['_id'],
    properties: {
      _id: {
        type: 'string',
        minLength: 1,
        description: 'ID do menu',
        errorMessage: {
          type: 'O ID deve ser um texto',
          minLength: 'O ID é obrigatório',
        },
      },
    },
    errorMessage: {
      required: {
        _id: 'O ID é obrigatório',
      },
    },
  },
  response: {
    200: {
      description: 'Menu restaurado com sucesso',
      type: 'null',
    },
    404: {
      description: 'Menu não encontrado',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Menu not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['MENU_NOT_FOUND'] },
      },
    },
    409: {
      description: 'Menu não está na lixeira',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Menu is not in trash'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['NOT_TRASHED'] },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['RESTORE_MENU_ERROR'] },
      },
    },
  },
};
