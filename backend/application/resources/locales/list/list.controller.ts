/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { LocaleListSchema } from './list.schema';
import LocaleListUseCase from './list.use-case';

@Controller({
  route: '/locales',
})
export default class {
  constructor(
    private readonly useCase: LocaleListUseCase = getInstanceByToken(
      LocaleListUseCase,
    ),
  ) {}

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
    const result = await this.useCase.execute();

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.send(result.value);
  }
}
