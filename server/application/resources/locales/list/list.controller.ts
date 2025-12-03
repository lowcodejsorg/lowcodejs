import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';
import { readdir } from 'fs/promises';
import { join } from 'path';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { LocaleListSchema } from './list.schema';

@Controller({
  route: '/locales',
})
export default class {
  @GET({
    url: '/',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: LocaleListSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const pathname = join(process.cwd(), '_system', 'locales');
    const files = await readdir(pathname);
    const locales = files.map((file) => ({ locale: file.split('.')[0] }));
    return response.send(locales);
  }
}
