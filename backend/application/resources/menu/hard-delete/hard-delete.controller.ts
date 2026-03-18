import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { MenuHardDeleteSchema } from './hard-delete.schema';
import MenuHardDeleteUseCase from './hard-delete.use-case';
import { MenuHardDeleteParamValidator } from './hard-delete.validator';

@Controller({
  route: '/menu',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuHardDeleteUseCase = getInstanceByToken(
      MenuHardDeleteUseCase,
    ),
  ) {}

  @DELETE({
    url: '/:_id/permanent',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: MenuHardDeleteSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = MenuHardDeleteParamValidator.parse(request.params);

    const result = await this.useCase.execute(params);

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
