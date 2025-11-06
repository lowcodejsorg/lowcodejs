import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { TableFieldShowSchema } from './show.schema';
import TableFieldShowUseCase from './show.use-case';
import { TableFieldShowParamValidator } from './show.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableFieldShowUseCase = getInstanceByToken(
      TableFieldShowUseCase,
    ),
  ) {}

  @GET({
    url: '/:slug/fields/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: TableFieldShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableFieldShowParamValidator.parse(request.params);

    const result = await this.useCase.execute(params);

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
