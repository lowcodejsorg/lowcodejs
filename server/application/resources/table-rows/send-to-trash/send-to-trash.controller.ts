import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { TableRowSendToTrashSchema } from './send-to-trash.schema';
import TableRowSendToTrashUseCase from './send-to-trash.use-case';
import { TableRowSendToTrashParamValidator } from './send-to-trash.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowSendToTrashUseCase = getInstanceByToken(
      TableRowSendToTrashUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:slug/rows/:_id/trash',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: TableRowSendToTrashSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableRowSendToTrashParamValidator.parse(request.params);

    const result = await this.useCase.execute({ ...params });

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
