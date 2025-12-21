import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, PUT } from 'fastify-decorators';
import z from 'zod';

const EnvSchema = z.object({
  LOCALE: z.enum(['pt-br', 'en-us']).default('pt-br'),
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(1024 * 1024 * 5),
  FILE_UPLOAD_ACCEPTED: z.string(),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.coerce.number().default(10),
  PAGINATION_PER_PAGE: z.coerce.number().default(50),

  LOGO_SMALL_URL: z.string().trim().optional().nullable(),
  LOGO_LARGE_URL: z.string().trim().optional().nullable(),

  // DATABASE_URL: z.string().trim(),

  EMAIL_PROVIDER_PASSWORD: z.string().trim(),
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),
});

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Setting } from '@application/model/setting.model';

import { SettingUpdateSchema } from './update.schema';

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
      const payload = EnvSchema.parse(request.body);

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
      if (error instanceof z.ZodError) {
        return response.status(400).send({
          message: 'Invalid request data',
          code: 400,
          cause: 'VALIDATION_ERROR',
        });
      }

      console.error('Error updating system settings:', error);
      return response.status(500).send({
        message: 'Internal server error while updating settings',
        code: 500,
        cause: 'SETTINGS_UPDATE_ERROR',
      });
    }
  }
}
