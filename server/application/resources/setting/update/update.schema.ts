import type { FastifySchema } from 'fastify';

export const SettingUpdateSchema: FastifySchema = {
  tags: ['Settings'],
  summary: 'Update system settings',
  description:
    'Updates system configuration settings in the settings properties file. Allows modification of locale, file upload configurations, and pagination settings.',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: [
      'LOCALE',
      'FILE_UPLOAD_MAX_SIZE',
      'FILE_UPLOAD_ACCEPTED',
      'FILE_UPLOAD_MAX_FILES_PER_UPLOAD',
      'PAGINATION_PER_PAGE',
      'DATABASE_URL',
      'EMAIL_PROVIDER_HOST',
      'EMAIL_PROVIDER_PORT',
      'EMAIL_PROVIDER_USER',
      'EMAIL_PROVIDER_PASSWORD',
    ],
    properties: {
      LOCALE: {
        type: 'string',
        enum: ['pt-br', 'en-us'],
        description: 'System default language',
      },
      FILE_UPLOAD_MAX_SIZE: {
        type: 'number',
        description: 'Maximum file size in bytes',
        examples: [10485760],
      },
      FILE_UPLOAD_ACCEPTED: {
        type: 'string',
        description: 'Accepted file extensions',
        examples: ['jpg; jpeg; png; pdf; doc; docx'],
      },
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: {
        type: 'number',
        description: 'Maximum files per upload',
        examples: [5],
      },
      PAGINATION_PER_PAGE: {
        type: 'number',
        description: 'Default items per page',
        examples: [20],
      },
      DATABASE_URL: {
        type: 'string',
        description: 'MongoDB connection URL',
        examples: ['mongodb://localhost:27017/lowcodejs'],
      },
      EMAIL_PROVIDER_HOST: {
        type: 'string',
        description: 'Email server host',
        examples: ['smtp.gmail.com'],
      },
      EMAIL_PROVIDER_PORT: {
        type: 'number',
        description: 'Email server port',
        examples: [587],
      },
      EMAIL_PROVIDER_USER: {
        type: 'string',
        description: 'Email server username',
        examples: ['user@example.com'],
      },
      EMAIL_PROVIDER_PASSWORD: {
        type: 'string',
        description: 'Email server password',
        examples: ['password123'],
      },
    },
  },
  response: {
    200: {
      description: 'Settings updated successfully',
      type: 'object',
      properties: {
        LOCALE: {
          type: 'string',
          enum: ['pt-br', 'en-us'],
          description: 'System default language',
        },
        FILE_UPLOAD_MAX_SIZE: {
          type: 'number',
          description: 'Maximum file size in bytes',
          examples: [10485760],
        },
        FILE_UPLOAD_ACCEPTED: {
          type: 'array',
          items: { type: 'string' },
          description: 'Accepted file extensions',
          examples: [['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']],
        },
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: {
          type: 'number',
          description: 'Maximum files per upload',
          examples: [5],
        },
        PAGINATION_PER_PAGE: {
          type: 'number',
          description: 'Default items per page',
          examples: [20],
        },
        DATABASE_URL: {
          type: 'string',
          description: 'MongoDB connection URL',
          examples: ['mongodb://localhost:27017/lowcodejs'],
        },
        EMAIL_PROVIDER_HOST: {
          type: 'string',
          description: 'Email server host',
          examples: ['smtp.gmail.com'],
        },
        EMAIL_PROVIDER_PORT: {
          type: 'number',
          description: 'Email server port',
          examples: [587],
        },
        EMAIL_PROVIDER_USER: {
          type: 'string',
          description: 'Email server username',
          examples: ['user@example.com'],
        },
        EMAIL_PROVIDER_PASSWORD: {
          type: 'string',
          description: 'Email server password',
          examples: ['password123'],
        },
      },
      examples: [
        {
          LOCALE: 'en-us',
          FILE_UPLOAD_MAX_SIZE: 10485760,
          FILE_UPLOAD_ACCEPTED: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
          FILE_UPLOAD_MAX_FILES_PER_UPLOAD: 5,
          PAGINATION_PER_PAGE: 20,
          DATABASE_URL: 'mongodb://localhost:27017/lowcodejs',
          EMAIL_PROVIDER_HOST: 'smtp.gmail.com',
          EMAIL_PROVIDER_PORT: 587,
          EMAIL_PROVIDER_USER: 'user@example.com',
          EMAIL_PROVIDER_PASSWORD: 'password123',
        },
      ],
    },
    400: {
      description: 'Bad request - Invalid request data or validation error',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: [
            'Invalid request data',
            'Validation error',
            'Invalid file size format',
            'Invalid locale',
          ],
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PARAMETERS', 'VALIDATION_ERROR'],
        },
      },
      examples: [
        {
          message: 'Invalid request data',
          code: 400,
          cause: 'VALIDATION_ERROR',
        },
      ],
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Unauthorized'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    404: {
      description: 'Not found - Configuration file not found',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Configuration file not found'],
        },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['SETTINGS_FILE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Configuration file not found',
          code: 404,
          cause: 'SETTINGS_FILE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error - File writing or server issues',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: [
            'Internal server error while updating settings',
            'File write error',
          ],
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
