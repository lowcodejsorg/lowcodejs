/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { SettingUpdateSchema } from './update.schema';
import SettingUpdateUseCase from './update.use-case';
import { SettingUpdateBodyValidator } from './update.validator';

@Controller({
  route: '/setting',
})
export default class {
  constructor(
    private readonly useCase: SettingUpdateUseCase = getInstanceByToken(
      SettingUpdateUseCase,
    ),
  ) {}

  @PUT({
    url: '',
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
    const payload = SettingUpdateBodyValidator.parse(request.body);

    const result = await this.useCase.execute(payload);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
