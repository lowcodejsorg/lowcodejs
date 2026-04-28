import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';

import { E_ROLE } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { RoleMiddleware } from '@application/middlewares/role.middleware';

import { MenuBulkDeleteSchema } from './bulk-delete.schema';
import MenuBulkDeleteUseCase from './bulk-delete.use-case';
import { MenuBulkDeleteBodyValidator } from './bulk-delete.validator';

@Controller({
  route: '/menu',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuBulkDeleteUseCase = getInstanceByToken(
      MenuBulkDeleteUseCase,
    ),
  ) {}

  @DELETE({
    url: '/bulk-delete',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        RoleMiddleware([E_ROLE.MASTER]),
      ],
      schema: MenuBulkDeleteSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = MenuBulkDeleteBodyValidator.parse(request.body);

    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        ...(error.errors && { errors: error.errors }),
      });
    }

    return response.status(200).send(result.value);
  }
}
