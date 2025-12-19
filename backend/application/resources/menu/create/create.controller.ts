import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import MenuCreateUseCase from './create.use-case';
import { MenuCreateBodyValidator } from './create.validator';

@Controller()
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuCreateUseCase = getInstanceByToken(
      MenuCreateUseCase,
    ),
  ) {}

  @POST({
    url: '/menu',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      // schema: UserCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = MenuCreateBodyValidator.parse(request.body);

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
