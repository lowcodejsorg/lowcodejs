import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { ProfileUpdateSchema } from './update.schema';
import ProfileUpdateUseCase from './update.use-case';
import { ProfileUpdateBodyValidator } from './update.validator';

@Controller({
  route: 'profile',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: ProfileUpdateUseCase = getInstanceByToken(
      ProfileUpdateUseCase,
    ),
  ) {}

  @PUT({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: ProfileUpdateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = ProfileUpdateBodyValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...body,
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
