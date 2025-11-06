import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import UserGroupPaginatedUseCase from './list-paginated.use-case';
import { UserGroupPaginatedSchema } from './paginated.schema';
import { UserGroupPaginatedQueryValidator } from './paginated.validator';

@Controller({
  route: 'user-group',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: UserGroupPaginatedUseCase = getInstanceByToken(
      UserGroupPaginatedUseCase,
    ),
  ) {}

  @GET({
    url: '/paginated',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: UserGroupPaginatedSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = UserGroupPaginatedQueryValidator.parse(request.query);
    const result = await this.useCase.execute(query);

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
