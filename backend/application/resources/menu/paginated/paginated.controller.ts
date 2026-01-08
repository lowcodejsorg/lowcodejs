import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import MenuPaginatedUseCase from './paginated.use-case';
import { MenuPaginatedQueryValidator } from './paginated.validator';

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
    url: '/paginated',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = MenuPaginatedQueryValidator.parse(request.query);

    const result = await this.useCase.execute({
      ...query,
    });

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
