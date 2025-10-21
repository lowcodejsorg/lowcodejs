import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';
import { readFile } from 'fs/promises';
import { join } from 'path';
import z from 'zod';

@Controller({
  route: '/locales',
})
export default class {
  @GET({
    url: '/:locale',
    options: {
      // onRequest: [AuthenticationMiddleware],
      schema: {
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
            description:
              'Internal server error - File reading or parsing issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['LOCALE_READ_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    try {
      const schema = z.object({
        locale: z.string(),
      });
      const { locale } = schema.parse(request.params);

      const pathname = join(
        process.cwd(),
        '_system',
        'locales',
        `${locale}.properties`,
      );

      const file = await readFile(pathname, 'utf-8');

      if (!file) {
        return response.status(404).send({
          message: 'Locale not found',
          code: 404,
          cause: 'LOCALE_NOT_FOUND',
        });
      }

      const translations: Record<string, string | string[]> = {};

      for (const line of file.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (!value.includes(';')) {
              translations[key.trim()] = value;
            } else {
              translations[key.trim()] = value
                .split(';')
                .filter(Boolean)
                .map((v) => v.trim());
            }
          }
        }
      }

      return response.status(200).send(translations);
    } catch (error) {
      console.error(error);
      return response.status(500).send({
        message: 'Internal server error',
        code: 500,
        cause: 'LOCALE_READ_ERROR',
      });
    }
  }
}
