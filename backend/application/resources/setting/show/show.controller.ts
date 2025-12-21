import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Setting } from '@application/model/setting.model';

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
    const setting = await Setting.findOne().lean();

    if (!setting)
      return response.send({
        ...process.env,
        FILE_UPLOAD_ACCEPTED:
          process.env.FILE_UPLOAD_ACCEPTED?.split(';') ?? [],
      });

    return response.send({
      ...setting,
      FILE_UPLOAD_ACCEPTED: setting.FILE_UPLOAD_ACCEPTED.split(';') ?? [],
    });
  }
}
