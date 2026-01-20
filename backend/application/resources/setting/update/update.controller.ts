/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Setting } from '@application/model/setting.model';

import { SettingUpdateSchema } from './update.schema';
import { SettingUpdateBodyValidator } from './update.validator';

@Controller({
  route: '/setting',
})
export default class {
  @PUT({
    url: '',
    // url: '/:filename',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: SettingUpdateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    try {
      const payload = SettingUpdateBodyValidator.parse(request.body);

      const updated = await Setting.findOneAndUpdate({}, payload, {
        upsert: true,
        new: true,
      });

      for (const [key, value] of Object.entries(payload)) {
        process.env[key] = String(value);
      }

      return response.status(200).send({
        ...updated.toJSON({
          flattenObjectIds: true,
        }),
        FILE_UPLOAD_ACCEPTED:
          updated
            .toJSON({
              flattenObjectIds: true,
            })
            .FILE_UPLOAD_ACCEPTED.split(';') ?? [],
      });
    } catch (error) {
      return response.status(500).send({
        message: 'Internal server error while updating settings',
        code: 500,
        cause: 'SETTINGS_UPDATE_ERROR',
      });
    }
  }
}
