import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { ListVisibilityMiddleware } from '@application/middlewares/list-visibility.middleware';

import { TableRowShowSchema } from './show.schema';
import TableRowShowUseCase from './show.use-case';
import { TableRowShowParamValidator } from './show.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowShowUseCase = getInstanceByToken(
      TableRowShowUseCase,
    ),
  ) {}

  @GET({
    url: '/:slug/rows/:_id',
    options: {
      onRequest: [ListVisibilityMiddleware],
      schema: TableRowShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableRowShowParamValidator.parse(request.params);
    const result = await this.useCase.execute({
      ...params,
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
