import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { E_ROLE } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { RoleMiddleware } from '@application/middlewares/role.middleware';

import { UserGroupBulkTrashSchema } from './bulk-trash.schema';
import UserGroupBulkTrashUseCase from './bulk-trash.use-case';
import { UserGroupBulkTrashBodyValidator } from './bulk-trash.validator';

@Controller({
  route: '/user-group',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: UserGroupBulkTrashUseCase = getInstanceByToken(
      UserGroupBulkTrashUseCase,
    ),
  ) {}

  @PATCH({
    url: '/bulk-trash',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        RoleMiddleware([E_ROLE.MASTER]),
      ],
      schema: UserGroupBulkTrashSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = UserGroupBulkTrashBodyValidator.parse(request.body);

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
