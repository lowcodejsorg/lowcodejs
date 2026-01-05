import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { TableAccessMiddleware } from '@application/middlewares/table-access.middleware';

import { TableRowRemoveFromTrashSchema } from './remove-from-trash.schema';
import TableRowRemoveFromTrashUseCase from './remove-from-trash.use-case';
import { TableRowRemoveFromTrashParamValidator } from './remove-from-trash.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowRemoveFromTrashUseCase = getInstanceByToken(
      TableRowRemoveFromTrashUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:slug/rows/:_id/restore',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
        TableAccessMiddleware({
          requiredPermission: 'UPDATE_ROW',
        }),
      ],
      schema: TableRowRemoveFromTrashSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableRowRemoveFromTrashParamValidator.parse(request.params);

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
