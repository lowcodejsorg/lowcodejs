import type { FastifySchema } from 'fastify';

export const SettingShowSchema: FastifySchema = {
  tags: ['Configurações'],
  summary: 'Buscar configurações do sistema',
  description:
    'Retorna todas as configurações do sistema incluindo locale, upload de arquivos e paginação',
  response: {
    200: {
      description: 'Configurações recuperadas com sucesso',
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
          examples: [10485760],
        },
        FILE_UPLOAD_ACCEPTED: {
          type: 'array',
          items: { type: 'string' },
          description: 'Extensões de arquivo aceitas',
          examples: [['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']],
        },
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: {
          type: 'number',
          description: 'Máximo de arquivos por upload',
          examples: [5],
        },
        PAGINATION_PER_PAGE: {
          type: 'number',
          description: 'Itens por página padrão',
          examples: [20],
        },
        MODEL_CLONE_TABLES: {
          type: 'string',
          nullable: true,
          description: 'Configuração de tabelas permitidas para clonagem de modelos',
          errorMessage: {
            type: 'O modelo de tabelas deve ser um texto',
          },
        },
        DATABASE_URL: {
          type: 'string',
          description: 'URL de conexão do MongoDB',
          examples: ['mongodb://localhost:27017/lowcodejs'],
        },
        EMAIL_PROVIDER_HOST: {
          type: 'string',
          description: 'Host do servidor de email',
          examples: ['smtp.gmail.com'],
        },
        EMAIL_PROVIDER_PORT: {
          type: 'number',
          description: 'Porta do servidor de email',
          examples: [587],
        },
        EMAIL_PROVIDER_USER: {
          type: 'string',
          description: 'Usuário do servidor de email',
          examples: ['usuario@exemplo.com'],
        },
        EMAIL_PROVIDER_PASSWORD: {
          type: 'string',
          description: 'Senha do servidor de email',
        },
        LOGO_SMALL_URL: {
          type: 'string',
          description: 'URL do logo pequeno',
          examples: ['/assets/logo-small.png'],
        },
        LOGO_LARGE_URL: {
          type: 'string',
          description: 'URL do logo grande',
          examples: ['/assets/logo-large.png'],
        },
      },
      examples: [
        {
          LOCALE: 'pt-br',
          FILE_UPLOAD_MAX_SIZE: 10485760,
          FILE_UPLOAD_ACCEPTED: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
          FILE_UPLOAD_MAX_FILES_PER_UPLOAD: 5,
          PAGINATION_PER_PAGE: 20,
          DATABASE_URL: 'mongodb://localhost:27017/lowcodejs',
          EMAIL_PROVIDER_HOST: 'smtp.gmail.com',
          EMAIL_PROVIDER_PORT: 587,
          EMAIL_PROVIDER_USER: 'usuario@exemplo.com',
        },
      ],
    },
    404: {
      description: 'Arquivo de configurações não encontrado',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Arquivo não encontrado'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['SETTINGS_FILE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Arquivo não encontrado',
          code: 404,
          cause: 'SETTINGS_FILE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro interno do servidor'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['SETTINGS_READ_ERROR'] },
      },
    },
  },
};
