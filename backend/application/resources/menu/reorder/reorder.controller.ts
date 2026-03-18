import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import MenuReorderUseCase from './reorder.use-case';
import { MenuReorderBodyValidator } from './reorder.validator';

@Controller()
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuReorderUseCase = getInstanceByToken(
      MenuReorderUseCase,
    ),
  ) {}

  @PATCH({
    url: '/menu/reorder',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = MenuReorderBodyValidator.parse(request.body);

    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(null);
  }
}
