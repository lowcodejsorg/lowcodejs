import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, PUT } from 'fastify-decorators';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import z from 'zod';

const EnvSchema = z.object({
  LOCALE: z.enum(['pt-br', 'en-us']).default('pt-br'),
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(1024 * 1024 * 5),
  FILE_UPLOAD_ACCEPTED: z.string(),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.coerce.number().default(10),
  PAGINATION_PER_PAGE: z.coerce.number().default(50),

  DATABASE_URL: z.string().trim(),

  EMAIL_PROVIDER_PASSWORD: z.string().trim(),
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),
});

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Env } from '@start/env';

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

      const pathname = join(process.cwd(), '_system', `setting.properties`);

      let fileContent = await readFile(pathname, 'utf-8');

      console.log(payload);

      // Update the LOCALE if provided
      if (payload.LOCALE) {
        fileContent = fileContent.replace(
          /LOCALE=.*/,
          `LOCALE=${payload.LOCALE}`,
        );
      }

      if (payload.FILE_UPLOAD_MAX_SIZE) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_MAX_SIZE=.*/,
          `FILE_UPLOAD_MAX_SIZE=${payload.FILE_UPLOAD_MAX_SIZE}`,
        );
      }

      if (payload.FILE_UPLOAD_ACCEPTED) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_ACCEPTED=.*/,
          `FILE_UPLOAD_ACCEPTED=${payload.FILE_UPLOAD_ACCEPTED}`,
        );
      }

      if (payload.FILE_UPLOAD_MAX_FILES_PER_UPLOAD) {
        fileContent = fileContent.replace(
          /FILE_UPLOAD_MAX_FILES_PER_UPLOAD=.*/,
          `FILE_UPLOAD_MAX_FILES_PER_UPLOAD=${payload.FILE_UPLOAD_MAX_FILES_PER_UPLOAD}`,
        );
      }

      if (payload.PAGINATION_PER_PAGE) {
        fileContent = fileContent.replace(
          /PAGINATION_PER_PAGE=.*/,
          `PAGINATION_PER_PAGE=${payload.PAGINATION_PER_PAGE}`,
        );
      }

      if (payload.DATABASE_URL) {
        fileContent = fileContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL=${payload.DATABASE_URL}`,
        );
      }

      if (payload.EMAIL_PROVIDER_HOST) {
        fileContent = fileContent.replace(
          /EMAIL_PROVIDER_HOST=.*/,
          `EMAIL_PROVIDER_HOST=${payload.EMAIL_PROVIDER_HOST}`,
        );
      }

      if (payload.EMAIL_PROVIDER_PORT) {
        fileContent = fileContent.replace(
          /EMAIL_PROVIDER_PORT=.*/,
          `EMAIL_PROVIDER_PORT=${payload.EMAIL_PROVIDER_PORT}`,
        );
      }

      if (payload.EMAIL_PROVIDER_USER) {
        fileContent = fileContent.replace(
          /EMAIL_PROVIDER_USER=.*/,
          `EMAIL_PROVIDER_USER=${payload.EMAIL_PROVIDER_USER}`,
        );
      }

      if (payload.EMAIL_PROVIDER_PASSWORD) {
        fileContent = fileContent.replace(
          /EMAIL_PROVIDER_PASSWORD=.*/,
          `EMAIL_PROVIDER_PASSWORD=${payload.EMAIL_PROVIDER_PASSWORD}`,
        );
      }

      await writeFile(pathname, fileContent);

      return response.status(200).send({
        ...Env,
        ...payload,
        FILE_UPLOAD_ACCEPTED: Env.FILE_UPLOAD_ACCEPTED.split(';'),
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
