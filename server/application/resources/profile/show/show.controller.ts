import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { ProfileShowSchema } from './show.schema';
import ProfileShowUseCase from './show.use-case';

@Controller({
  route: 'profile',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: ProfileShowUseCase = getInstanceByToken(
      ProfileShowUseCase,
    ),
  ) {}

  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: ProfileShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const result = await this.useCase.execute({
      _id: request.user.sub,
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
