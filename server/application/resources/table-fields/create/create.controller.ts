import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { TableFieldCreateSchema } from './create.schema';
import TableFieldCreateUseCase from './create.use-case';
import {
  TableFieldCreateBodyValidator,
  TableFieldCreateParamValidator,
} from './create.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableFieldCreateUseCase = getInstanceByToken(
      TableFieldCreateUseCase,
    ),
  ) {}

  @POST({
    url: '/:slug/fields',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: TableFieldCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = TableFieldCreateBodyValidator.parse(request.body);
    const params = TableFieldCreateParamValidator.parse(request.params);
    const result = await this.useCase.execute({ ...payload, ...params });

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
