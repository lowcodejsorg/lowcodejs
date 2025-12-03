import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { UserGroupShowSchema } from './show.schema';
import UserGroupShowUseCase from './show.use-case';
import { UserGroupShowParamValidator } from './show.validator';

@Controller({
  route: '/user-group',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: UserGroupShowUseCase = getInstanceByToken(
      UserGroupShowUseCase,
    ),
  ) {}

  @GET({
    url: '/:_id',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: UserGroupShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = UserGroupShowParamValidator.parse(request.params);
    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result?.value);
  }
}
