import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { ListVisibilityMiddleware } from '@application/middlewares/list-visibility.middleware';

import { TableRowCreateSchema } from './create.schema';
import TableRowCreateUseCase from './create.use-case';
import {
  TableRowCreateBodyValidator,
  TableRowCreateParamValidator,
} from './create.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowCreateUseCase = getInstanceByToken(
      TableRowCreateUseCase,
    ),
  ) {}

  @POST({
    url: '/:slug/rows',
    options: {
      onRequest: [ListVisibilityMiddleware],
      schema: TableRowCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    console.log('request.body', request.body);
    const payload = TableRowCreateBodyValidator.parse(request.body);
    const params = TableRowCreateParamValidator.parse(request.params);

    console.log('payload', payload);
    console.log('params', request?.user?.sub);

    const result = await this.useCase.execute({
      ...payload,
      ...params,
      ...(request?.user?.sub && { creator: request.user.sub }),
    });

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
