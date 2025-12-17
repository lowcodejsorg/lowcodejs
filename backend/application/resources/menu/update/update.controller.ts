import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import MenuUpdateUseCase from './update.use-case';
import {
  MenuUpdateBodyValidator,
  MenuUpdateParamsValidator,
} from './update.validator';

@Controller()
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: MenuUpdateUseCase = getInstanceByToken(
      MenuUpdateUseCase,
    ),
  ) {}

  @PUT({
    url: '/menu/:_id',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      // schema: MenuUpdateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = MenuUpdateParamsValidator.parse(request.params);
    const body = MenuUpdateBodyValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...params,
      ...body,
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
