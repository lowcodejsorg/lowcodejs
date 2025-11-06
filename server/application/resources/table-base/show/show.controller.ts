import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { ListVisibilityMiddleware } from '@application/middlewares/list-visibility.middleware';

import { TableShowSchema } from './show.schema';
import TableShowUseCase from './show.use-case';
import { TableShowParamValidator } from './show.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableShowUseCase = getInstanceByToken(
      TableShowUseCase,
    ),
  ) {}

  @GET({
    url: '/:slug',
    options: {
      onRequest: [ListVisibilityMiddleware],
      schema: TableShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableShowParamValidator.parse(request.params);

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
