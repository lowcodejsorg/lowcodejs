import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { TableAccessMiddleware } from '@application/middlewares/table-access.middleware';

import { BulkRestoreSchema } from './bulk-restore.schema';
import BulkRestoreUseCase from './bulk-restore.use-case';
import {
  BulkRestoreBodyValidator,
  BulkRestoreParamsValidator,
} from './bulk-restore.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: BulkRestoreUseCase = getInstanceByToken(
      BulkRestoreUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:slug/rows/bulk-restore',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
        TableAccessMiddleware({
          requiredPermission: 'UPDATE_ROW',
        }),
      ],
      schema: BulkRestoreSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = BulkRestoreParamsValidator.parse(request.params);
    const body = BulkRestoreBodyValidator.parse(request.body);

    const result = await this.useCase.execute({ ...params, ...body });

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
