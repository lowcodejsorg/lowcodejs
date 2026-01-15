import type { FastifySchema } from 'fastify';

export const UserGroupPaginatedSchema: FastifySchema = {
  tags: ['Grupos de Usuários'],
  summary: 'Listar grupos de usuários com paginação',
  description:
    'Retorna uma lista paginada de grupos de usuários com funcionalidade de busca',
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
        description: 'Termo de busca para filtrar grupos',
      },
    },
  },
  response: {
    200: {
      description: 'Lista paginada de grupos de usuários',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'ID do grupo' },
              name: { type: 'string', description: 'Nome do grupo' },
              slug: {
                type: 'string',
                description: 'Identificador único do grupo',
              },
              description: {
                type: 'string',
                description: 'Descrição do grupo',
              },
              permissions: {
                type: 'array',
                description: 'Permissões atribuídas ao grupo',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', description: 'ID da permissão' },
                    name: { type: 'string', description: 'Nome da permissão' },
                    slug: { type: 'string', description: 'Slug da permissão' },
                    description: {
                      type: 'string',
                      description: 'Descrição da permissão',
                    },
                    trashed: {
                      type: 'boolean',
                      description: 'Se a permissão está na lixeira',
                    },
                    trashedAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                      description: 'Data em que foi movido para lixeira',
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
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
        message: { type: 'string', enum: ['Autenticação necessária'] },
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
        cause: { type: 'string', enum: ['LIST_USER_GROUP_PAGINATED_ERROR'] },
      },
    },
  },
};
