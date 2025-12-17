import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { TableAccessMiddleware } from '@application/middlewares/table-access.middleware';

import { TableRowDeleteSchema } from './delete.schema';
import TableRowDeleteUseCase from './delete.use-case';
import { TableRowDeleteParamValidator } from './delete.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowDeleteUseCase = getInstanceByToken(
      TableRowDeleteUseCase,
    ),
  ) {}

  @DELETE({
    url: '/:slug/rows/:_id',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
        TableAccessMiddleware({
          requiredPermission: 'REMOVE_ROW',
          // Sem allowedGroups - valida apenas ownership
        }),
      ],
      schema: TableRowDeleteSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = TableRowDeleteParamValidator.parse(request.params);
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
