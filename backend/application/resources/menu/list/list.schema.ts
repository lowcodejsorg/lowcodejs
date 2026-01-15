import type { FastifySchema } from 'fastify';

export const MenuListSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Listar todos os itens de menu',
  description: 'Retorna a lista completa de itens de menu sem paginação',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'Lista completa de itens de menu',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'ID do menu' },
          name: { type: 'string', description: 'Nome do menu' },
          slug: { type: 'string', description: 'Slug do menu' },
          type: { type: 'string', description: 'Tipo do menu' },
          parent: { type: 'string', nullable: true, description: 'ID do pai' },
          table: { type: 'string', nullable: true, description: 'ID da tabela' },
          html: { type: 'string', nullable: true, description: 'Conteúdo HTML' },
          url: { type: 'string', nullable: true, description: 'URL' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
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
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro interno do servidor'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['LIST_MENU_ERROR'] },
      },
    },
  },
};
