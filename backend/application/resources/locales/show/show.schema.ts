import type { FastifySchema } from 'fastify';

export const LocaleShowSchema: FastifySchema = {
  tags: ['Locales'],
  summary: 'Get system translations by locale',
  description:
    'Retrieves all system translations for a specific locale from properties files. Supports property parsing with arrays and single values.',
  // security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['locale'],
    properties: {
      locale: {
        type: 'string',
        description: 'Locale identifier (language-country format)',
        examples: ['pt-br', 'en-us'],
        pattern: '^[a-z]{2}-[a-z]{2}$',
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Translations retrieved successfully',
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string', description: 'Single translation value' },
          {
            type: 'array',
            items: { type: 'string' },
            description:
              'Array of translation values (comma-separated in properties)',
          },
        ],
      },
      examples: [
        {
          SIDEBAR_MENU_HOME_LABEL: 'Home',
          USER_ROUTE_TABLE_HEADERS: ['Name', 'E-mail', 'Role', 'Status'],
          FIELD_TYPE_TEXT_SHORT_LABEL: 'Short Text',
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
      description: 'Not found - Locale file does not exist',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Locale not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['LOCALE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Locale not found',
          code: 404,
          cause: 'LOCALE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error - File reading or parsing issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['LOCALE_READ_ERROR'] },
      },
    },
  },
};
