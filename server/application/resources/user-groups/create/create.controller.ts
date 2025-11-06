import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { UserGroupCreateSchema } from './create.schema';
import UserGroupCreateUseCase from './create.use-case';
import { UserCreateGroupBodyValidator } from './create.validator';

@Controller()
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: UserGroupCreateUseCase = getInstanceByToken(
      UserGroupCreateUseCase,
    ),
  ) {}

  @POST({
    url: '/user-group',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: UserGroupCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = UserCreateGroupBodyValidator.parse(request.body);

    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(201).send(result.value);
  }
}
