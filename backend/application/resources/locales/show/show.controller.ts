/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';
import { readFile } from 'fs/promises';
import { join } from 'path';
import z from 'zod';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { LocaleShowSchema } from './show.schema';

@Controller({
  route: '/locales',
})
export default class {
  @GET({
    url: '/:locale',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: true,
        }),
      ],
      schema: LocaleShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    try {
      const schema = z.object({
        locale: z.string(),
      });
      const { locale } = schema.parse(request.params);

      const pathname = join(process.cwd(), '_locales', `${locale}.properties`);

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
      return response.status(500).send({
        message: 'Internal server error',
        code: 500,
        cause: 'LOCALE_READ_ERROR',
      });
    }
  }
}
