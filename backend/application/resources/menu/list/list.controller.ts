import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import MenuPaginatedUseCase from './list.use-case';

@Controller({
  route: '/menu',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuPaginatedUseCase = getInstanceByToken(
      MenuPaginatedUseCase,
    ),
  ) {}

  @GET({
    url: '',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
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

    return response.status(200).send(result.value);
  }
}
