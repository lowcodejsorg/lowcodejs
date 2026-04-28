import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { E_ROLE } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { RoleMiddleware } from '@application/middlewares/role.middleware';

import { UserGroupBulkRestoreSchema } from './bulk-restore.schema';
import UserGroupBulkRestoreUseCase from './bulk-restore.use-case';
import { UserGroupBulkRestoreBodyValidator } from './bulk-restore.validator';

@Controller({
  route: '/user-group',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: UserGroupBulkRestoreUseCase = getInstanceByToken(
      UserGroupBulkRestoreUseCase,
    ),
  ) {}

  @PATCH({
    url: '/bulk-restore',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        RoleMiddleware([E_ROLE.MASTER]),
      ],
      schema: UserGroupBulkRestoreSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = UserGroupBulkRestoreBodyValidator.parse(request.body);

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
