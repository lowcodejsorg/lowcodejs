import type { FastifySchema } from 'fastify';

export const SettingUpdateSchema: FastifySchema = {
  tags: ['Configurações'],
  summary: 'Atualizar configurações do sistema',
  description:
    'Atualiza as configurações do sistema incluindo locale, upload de arquivos e configurações de email',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: [
      'LOCALE',
      'FILE_UPLOAD_MAX_SIZE',
      'FILE_UPLOAD_ACCEPTED',
      'FILE_UPLOAD_MAX_FILES_PER_UPLOAD',
      'PAGINATION_PER_PAGE',
      'EMAIL_PROVIDER_HOST',
      'EMAIL_PROVIDER_PORT',
      'EMAIL_PROVIDER_USER',
      'EMAIL_PROVIDER_PASSWORD',
    ],
    properties: {
      LOCALE: {
        type: 'string',
        enum: ['pt-br', 'en-us'],
        description: 'Idioma padrão do sistema',
        errorMessage: {
          type: 'O locale deve ser um texto',
          enum: 'O locale deve ser pt-br ou en-us',
        },
      },
      FILE_UPLOAD_MAX_SIZE: {
        type: 'number',
        minimum: 1,
        description: 'Tamanho máximo de arquivo em bytes (mínimo 1)',
        errorMessage: {
          type: 'O tamanho máximo de arquivo deve ser um número',
          minimum: 'O tamanho máximo de arquivo deve ser maior que zero',
        },
      },
      FILE_UPLOAD_ACCEPTED: {
        type: 'string',
        minLength: 1,
        description: 'Extensões de arquivo aceitas (separadas por ;)',
        errorMessage: {
          type: 'As extensões aceitas são obrigatórias',
          minLength: 'As extensões aceitas são obrigatórias',
        },
      },
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: {
        type: 'number',
        minimum: 1,
        description: 'Máximo de arquivos por upload (mínimo 1)',
        errorMessage: {
          type: 'O máximo de arquivos por upload deve ser um número',
          minimum: 'O máximo de arquivos por upload deve ser maior que zero',
        },
      },
      PAGINATION_PER_PAGE: {
        type: 'number',
        minimum: 1,
        description: 'Itens por página padrão (mínimo 1)',
        errorMessage: {
          type: 'A paginação deve ser um número',
          minimum: 'A paginação deve ser maior que zero',
        },
      },
      EMAIL_PROVIDER_HOST: {
        type: 'string',
        minLength: 1,
        description: 'Host do servidor de email',
        errorMessage: {
          type: 'O host de email deve ser um texto',
          minLength: 'O host de email é obrigatório',
        },
      },
      EMAIL_PROVIDER_PORT: {
        type: 'number',
        minimum: 1,
        description: 'Porta do servidor de email (mínimo 1)',
        errorMessage: {
          type: 'A porta de email deve ser um número',
          minimum: 'A porta de email deve ser maior que zero',
        },
      },
      EMAIL_PROVIDER_USER: {
        type: 'string',
        minLength: 1,
        description: 'Usuário do servidor de email',
        errorMessage: {
          type: 'O usuário de email deve ser um texto',
          minLength: 'O usuário de email é obrigatório',
        },
      },
      EMAIL_PROVIDER_PASSWORD: {
        type: 'string',
        minLength: 1,
        description: 'Senha do servidor de email',
        errorMessage: {
          type: 'A senha de email deve ser um texto',
          minLength: 'A senha de email é obrigatória',
        },
      },
      LOGO_SMALL_URL: {
        type: 'string',
        nullable: true,
        description: 'URL do logo pequeno',
        errorMessage: {
          type: 'A URL do logo pequeno deve ser um texto',
        },
      },
      LOGO_LARGE_URL: {
        type: 'string',
        nullable: true,
        description: 'URL do logo grande',
        errorMessage: {
          type: 'A URL do logo grande deve ser um texto',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        LOCALE: 'O locale é obrigatório',
        FILE_UPLOAD_MAX_SIZE: 'O tamanho máximo de arquivo é obrigatório',
        FILE_UPLOAD_ACCEPTED: 'As extensões aceitas são obrigatórias',
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD:
          'O máximo de arquivos por upload é obrigatório',
        PAGINATION_PER_PAGE: 'A paginação é obrigatória',
        EMAIL_PROVIDER_HOST: 'O host de email é obrigatório',
        EMAIL_PROVIDER_PORT: 'A porta de email é obrigatória',
        EMAIL_PROVIDER_USER: 'O usuário de email é obrigatório',
        EMAIL_PROVIDER_PASSWORD: 'A senha de email é obrigatória',
      },
      additionalProperties: 'Campos extras não são permitidos',
    },
  },
  response: {
    200: {
      description: 'Configurações atualizadas com sucesso',
      type: 'object',
      properties: {
        LOCALE: {
          type: 'string',
          enum: ['pt-br', 'en-us'],
          description: 'Idioma padrão do sistema',
        },
        FILE_UPLOAD_MAX_SIZE: {
          type: 'number',
          description: 'Tamanho máximo de arquivo em bytes',
        },
        FILE_UPLOAD_ACCEPTED: {
          type: 'array',
          items: { type: 'string' },
          description: 'Extensões de arquivo aceitas',
        },
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: {
          type: 'number',
          description: 'Máximo de arquivos por upload',
        },
        PAGINATION_PER_PAGE: {
          type: 'number',
          description: 'Itens por página padrão',
        },
        EMAIL_PROVIDER_HOST: {
          type: 'string',
          description: 'Host do servidor de email',
        },
        EMAIL_PROVIDER_PORT: {
          type: 'number',
          description: 'Porta do servidor de email',
        },
        EMAIL_PROVIDER_USER: {
          type: 'string',
          description: 'Usuário do servidor de email',
        },
        EMAIL_PROVIDER_PASSWORD: {
          type: 'string',
          description: 'Senha do servidor de email',
        },
        LOGO_SMALL_URL: {
          type: 'string',
          description: 'URL do logo pequeno',
        },
        LOGO_LARGE_URL: {
          type: 'string',
          description: 'URL do logo grande',
        },
      },
    },
    400: {
      description: 'Requisição inválida - Erro de validação',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Mensagem de erro',
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PAYLOAD_FORMAT', 'VALIDATION_ERROR'],
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
      description: 'Arquivo de configurações não encontrado',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Arquivo de configurações não encontrado'],
        },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['SETTINGS_FILE_NOT_FOUND'] },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Erro interno do servidor ao atualizar configurações'],
        },
        code: { type: 'number', enum: [500] },
        cause: {
          type: 'string',
          enum: ['SETTINGS_UPDATE_ERROR', 'FILE_WRITE_ERROR'],
        },
      },
    },
  },
};
