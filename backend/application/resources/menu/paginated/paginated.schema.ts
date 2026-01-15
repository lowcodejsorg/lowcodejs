import type { FastifySchema } from 'fastify';

export const MenuPaginatedSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Listar itens de menu com paginação',
  description:
    'Retorna uma lista paginada de itens de menu com funcionalidade de busca',
  security: [{ cookieAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Número da página',
      },
      perPage: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Itens por página',
      },
      search: {
        type: 'string',
        description: 'Termo de busca para filtrar itens de menu',
      },
    },
  },
  response: {
    200: {
      description: 'Lista paginada de itens de menu',
      type: 'object',
      properties: {
        data: {
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
        meta: {
          type: 'object',
          description: 'Metadados da paginação',
          properties: {
            total: { type: 'number', description: 'Total de registros' },
            perPage: { type: 'number', description: 'Itens por página' },
            page: { type: 'number', description: 'Página atual' },
            lastPage: { type: 'number', description: 'Última página' },
            firstPage: { type: 'number', description: 'Primeira página' },
          },
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
        cause: { type: 'string', enum: ['LIST_MENU_PAGINATED_ERROR'] },
      },
    },
  },
};
