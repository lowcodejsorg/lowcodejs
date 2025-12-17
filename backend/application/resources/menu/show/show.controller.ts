import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { MenuShowSchema } from './show.schema';
import MenuShowUseCase from './show.use-case';
import { MenuShowParamValidator } from './show.validator';

@Controller({
  route: '/menu',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuShowUseCase = getInstanceByToken(
      MenuShowUseCase,
    ),
  ) {}

  @GET({
    url: '/:_id',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: MenuShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = MenuShowParamValidator.parse(request.params);

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
