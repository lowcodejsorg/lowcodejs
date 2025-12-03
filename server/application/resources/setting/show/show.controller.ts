import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Env } from '@start/env';

import { SettingShowSchema } from './show.schema';

@Controller({
  route: '/setting',
})
export default class {
  @GET({
    url: '',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: true,
        }),
      ],
      schema: SettingShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const pathname = join(process.cwd(), '_system', `setting.properties`);

    const file = await readFile(pathname, 'utf-8');

    if (!file) {
      return response.status(404).send({
        message: 'File not found',
        code: 404,
        cause: 'SETTINGS_FILE_NOT_FOUND',
      });
    }

    return response.send({
      ...Env,
      FILE_UPLOAD_ACCEPTED: Env.FILE_UPLOAD_ACCEPTED.split(';'),
    });
  }
}
