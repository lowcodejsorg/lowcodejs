import type { FastifySchema } from 'fastify';

export const SettingShowSchema: FastifySchema = {
  tags: ['Settings'],
  summary: 'Get system settings',
  description:
    'Retrieves all system configuration settings from the settings properties file. Includes locale, file upload, and pagination configurations.',
  // security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'System settings retrieved successfully',
      type: 'object',
      // additionalProperties: {
      //   oneOf: [
      //     { type: 'string', description: 'Single setting value' },
      //     {
      //       type: 'array',
      //       items: { type: 'string' },
      //       description:
      //         'Array of setting values (comma-separated in properties)',
      //     },
      //   ],
      // },
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
    // 401: {
    //   description: 'Unauthorized - Authentication required',
    //   type: 'object',
    //   properties: {
    //     message: { type: 'string', enum: ['Unauthorized'] },
    //     code: { type: 'number', enum: [401] },
    //     cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
    //   },
    // },
    404: {
      description: 'Not found - Settings file does not exist',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['File not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['SETTINGS_FILE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'File not found',
          code: 404,
          cause: 'SETTINGS_FILE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error - File reading or parsing issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['SETTINGS_READ_ERROR'] },
      },
    },
  },
};
