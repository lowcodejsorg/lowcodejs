import type { FastifySchema } from 'fastify';

export const SettingUpdateSchema: FastifySchema = {
  tags: ['Configurações'],
  summary: 'Atualizar configurações do sistema',
  description:
    'Atualiza as configurações do sistema incluindo locale, upload de arquivos e configurações de email',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    properties: {
      SYSTEM_NAME: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Nome do sistema exibido no título da plataforma',
        errorMessage: {
          type: 'O nome do sistema deve ser um texto',
          minLength: 'O nome do sistema é obrigatório',
          maxLength: 'O nome do sistema deve ter no máximo 100 caracteres',
        },
      },
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
      MODEL_CLONE_TABLES: {
        type: 'array',
        nullable: true,
        description:
          'Configuração de tabelas permitidas para clonagem de modelos',
        errorMessage: {
          type: 'O modelo de tabelas deve ser um texto',
        },
      },
      EMAIL_PROVIDER_HOST: {
        type: 'string',
        nullable: true,
        description: 'Host do servidor de email',
      },
      EMAIL_PROVIDER_PORT: {
        type: 'number',
        nullable: true,
        description: 'Porta do servidor de email',
      },
      EMAIL_PROVIDER_USER: {
        type: 'string',
        nullable: true,
        description: 'Usuário do servidor de email',
      },
      EMAIL_PROVIDER_PASSWORD: {
        type: 'string',
        nullable: true,
        description: 'Senha do servidor de email',
      },
      EMAIL_PROVIDER_FROM: {
        type: 'string',
        nullable: true,
        description: 'Remetente (MAIL FROM) do servidor de email',
      },
      OPENAI_API_KEY: {
        type: 'string',
        nullable: true,
        description: 'Chave da API OpenAI para o assistente IA',
      },
      AI_ASSISTANT_ENABLED: {
        type: 'boolean',
        nullable: true,
        description: 'Habilitar ou desabilitar o assistente IA',
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
      STORAGE_DRIVER: {
        type: 'string',
        enum: ['local', 's3'],
        nullable: true,
        description: 'Driver de armazenamento (local ou S3)',
      },
      STORAGE_ENDPOINT: {
        type: 'string',
        nullable: true,
        description: 'Endpoint do servidor S3',
      },
      STORAGE_REGION: {
        type: 'string',
        nullable: true,
        description: 'Região do S3',
      },
      STORAGE_BUCKET: {
        type: 'string',
        nullable: true,
        description: 'Nome do bucket S3',
      },
      STORAGE_ACCESS_KEY: {
        type: 'string',
        nullable: true,
        description: 'Chave de acesso S3',
      },
      STORAGE_SECRET_KEY: {
        type: 'string',
        nullable: true,
        description: 'Chave secreta S3',
      },
    },
    additionalProperties: false,
    errorMessage: {
      additionalProperties: 'Campos extras não são permitidos',
    },
  },
  response: {
    200: {
      description: 'Configurações atualizadas com sucesso',
      type: 'object',
      properties: {
        SYSTEM_NAME: {
          type: 'string',
          description: 'Nome do sistema exibido no título da plataforma',
        },
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
        MODEL_CLONE_TABLES: {
          type: 'array',
          items: { type: 'string' },
          description: 'Modelo de Tabelas para Clonagem',
        },
        EMAIL_PROVIDER_HOST: {
          type: 'string',
          nullable: true,
          description: 'Host do servidor de email',
        },
        EMAIL_PROVIDER_PORT: {
          type: 'number',
          nullable: true,
          description: 'Porta do servidor de email',
        },
        EMAIL_PROVIDER_USER: {
          type: 'string',
          nullable: true,
          description: 'Usuário do servidor de email',
        },
        EMAIL_PROVIDER_PASSWORD: {
          type: 'string',
          nullable: true,
          description: 'Senha do servidor de email',
        },
        EMAIL_PROVIDER_FROM: {
          type: 'string',
          nullable: true,
          description: 'Remetente (MAIL FROM) do servidor de email',
        },
        OPENAI_API_KEY: {
          type: 'string',
          nullable: true,
          description: 'Chave da API OpenAI para o assistente IA',
        },
        AI_ASSISTANT_ENABLED: {
          type: 'boolean',
          description: 'Habilitar ou desabilitar o assistente IA',
        },
        SETUP_COMPLETED: {
          type: 'boolean',
          description: 'Indica se o setup inicial foi concluído',
        },
        SETUP_CURRENT_STEP: {
          type: 'string',
          nullable: true,
          enum: ['admin', 'name', 'logos', 'upload', 'paging', 'email'],
          description: 'Etapa atual do setup wizard (null se concluído)',
        },
        LOGO_SMALL_URL: {
          type: 'string',
          nullable: true,
          description: 'URL do logo pequeno',
        },
        LOGO_LARGE_URL: {
          type: 'string',
          nullable: true,
          description: 'URL do logo grande',
        },
        STORAGE_DRIVER: {
          type: 'string',
          description: 'Driver de armazenamento (local ou S3)',
        },
        STORAGE_ENDPOINT: {
          type: 'string',
          description: 'Endpoint do servidor S3',
        },
        STORAGE_REGION: {
          type: 'string',
          description: 'Região do S3',
        },
        STORAGE_BUCKET: {
          type: 'string',
          description: 'Nome do bucket S3',
        },
        STORAGE_ACCESS_KEY: {
          type: 'string',
          description: 'Chave de acesso S3',
        },
        STORAGE_SECRET_KEY: {
          type: 'string',
          description: 'Chave secreta S3',
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
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
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
        message: {
          type: 'string',
          enum: ['Erro interno do servidor ao atualizar configurações'],
        },
        code: { type: 'number', enum: [500] },
        cause: {
          type: 'string',
          enum: ['SETTINGS_UPDATE_ERROR', 'FILE_WRITE_ERROR'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
