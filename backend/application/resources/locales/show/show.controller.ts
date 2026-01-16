/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { LocaleShowSchema } from './show.schema';
import LocaleShowUseCase from './show.use-case';
import { LocaleShowParamValidator } from './show.validator';

@Controller({
  route: '/locales',
})
export default class {
  constructor(
    private readonly useCase: LocaleShowUseCase = getInstanceByToken(
      LocaleShowUseCase,
    ),
  ) {}

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
    const params = LocaleShowParamValidator.parse(request.params);
    const result = await this.useCase.execute(params);

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
