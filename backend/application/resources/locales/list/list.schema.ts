import type { FastifySchema } from 'fastify';

export const LocaleListSchema: FastifySchema = {
  tags: ['Locale'],
  summary: 'Get list of available locales',
  description:
    'Retrieves a list of all available system locales for internationalization',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'List of available system locales',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          locale: {
            type: 'string',
            description: 'Locale code (ISO 639-1 language code)',
            examples: ['en', 'pt', 'es', 'fr'],
          },
        },
      },
    },
    401: {
      description: 'Unauthorized - Authentication required',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Unauthorized'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
      examples: [
        {
          message: 'Unauthorized',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
        },
      ],
    },
    500: {
      description: 'Internal server error - Unable to read locale files',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['LOCALES_READ_ERROR'] },
      },
      examples: [
        {
          message: 'Internal server error',
          code: 500,
          cause: 'LOCALES_READ_ERROR',
        },
      ],
    },
  },
};
