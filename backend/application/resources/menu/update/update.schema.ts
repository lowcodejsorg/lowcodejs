import type { FastifySchema } from 'fastify';

export const MenuUpdateSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Atualizar item de menu',
  description: 'Atualiza um item de menu existente com novos valores opcionais',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['_id'],
    properties: {
      _id: {
        type: 'string',
        minLength: 1,
        description: 'ID do item de menu',
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
  body: {
    type: 'object',
    additionalProperties: false,
    errorMessage: {
      additionalProperties: 'Campos extras não são permitidos',
    },
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Nome do item de menu',
        errorMessage: {
          type: 'O nome deve ser um texto',
          minLength: 'O nome é obrigatório',
        },
      },
      type: {
        type: 'string',
        enum: ['TABLE', 'PAGE', 'FORM', 'EXTERNAL', 'SEPARATOR'],
        description: 'Tipo do item de menu',
        errorMessage: {
          type: 'O tipo deve ser um texto',
          enum: 'Tipo inválido',
        },
      },
      parent: {
        type: 'string',
        description: 'ID do menu pai',
        nullable: true,
        errorMessage: {
          type: 'O menu pai deve ser um texto',
        },
      },
      table: {
        type: 'string',
        description: 'ID da tabela (obrigatório para tipos TABLE/FORM)',
        nullable: true,
        errorMessage: {
          type: 'A tabela deve ser um texto',
        },
      },
      html: {
        type: 'string',
        description:
          'Conteúdo HTML (obrigatório quando type=PAGE)',
        nullable: true,
        errorMessage: {
          type: 'O HTML deve ser um texto',
        },
      },
      url: {
        type: 'string',
        description: 'URL externa (obrigatório quando type=EXTERNAL)',
        nullable: true,
        errorMessage: {
          type: 'A URL deve ser um texto',
        },
      },
    },
  },
  response: {
    200: {
      description: 'Item de menu atualizado com sucesso',
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
    400: {
      description: 'Requisição inválida - Falha na validação',
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Mensagem de erro' },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PAYLOAD_FORMAT', 'INVALID_PARAMETERS'],
        },
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
      description: 'Recurso não encontrado',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Menu not found', 'Table not found', 'Parent menu not found'],
        },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['MENU_NOT_FOUND', 'TABLE_NOT_FOUND', 'PARENT_MENU_NOT_FOUND'],
        },
      },
    },
    409: {
      description: 'Conflito - Menu com este nome já existe',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Menu already exists'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['MENU_ALREADY_EXISTS'] },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro interno do servidor'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['UPDATE_MENU_ERROR'] },
      },
    },
  },
};
