import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { UserGroupListSchema } from './list.schema';
import UserGroupListUseCase from './list.use-case';

@Controller({
  route: 'user-group',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: UserGroupListUseCase = getInstanceByToken(
      UserGroupListUseCase,
    ),
  ) {}

  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: UserGroupListSchema,
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
