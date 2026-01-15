import type { FastifySchema } from 'fastify';

export const MenuDeleteSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Excluir menu por ID (soft delete)',
  description:
    'Move um item de menu para a lixeira. Impede exclusão de separadores com filhos ativos.',
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
      description: 'Menu movido para lixeira com sucesso',
      type: 'null',
    },
    400: {
      description: 'Requisição inválida - Falha na validação',
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Mensagem de erro' },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_PAYLOAD_FORMAT'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Erros de validação por campo',
        },
      },
    },
    401: {
      description: 'Não autorizado - Autenticação necessária',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Não autorizado'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
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
      description: 'Separador possui filhos ativos',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Separator has active children'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['SEPARATOR_HAS_CHILDREN'] },
        data: {
          type: 'object',
          properties: {
            childrenCount: {
              type: 'number',
              description: 'Quantidade de filhos',
            },
            children: {
              type: 'array',
              description: 'Lista de filhos',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro interno do servidor'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['DELETE_MENU_ERROR'] },
      },
    },
  },
};
