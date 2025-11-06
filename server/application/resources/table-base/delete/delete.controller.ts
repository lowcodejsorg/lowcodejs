/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { TableDeleteSchema } from './delete.schema';
import TableDeleteUseCase from './delete.use-case';
import { TableDeleteParamValidator } from './delete.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    private readonly useCase: TableDeleteUseCase = getInstanceByToken(
      TableDeleteUseCase,
    ),
  ) {}

  @DELETE({
    url: '/:slug',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: TableDeleteSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableDeleteParamValidator.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send();
  }
}
