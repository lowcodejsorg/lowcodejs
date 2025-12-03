/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { TableAccessMiddleware } from '@application/middlewares/table-access.middleware';

import { TableUpdateSchema } from './update.schema';
import TableUpdateUseCase from './update.use-case';
import {
  TableUpdateBodyValidator,
  TableUpdateParamValidator,
} from './update.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    private readonly useCase: TableUpdateUseCase = getInstanceByToken(
      TableUpdateUseCase,
    ),
  ) {}

  @PUT({
    url: '/:slug',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
        TableAccessMiddleware({
          requiredPermission: 'UPDATE_TABLE',
          // Sem allowedGroups - valida apenas ownership
        }),
      ],
      schema: TableUpdateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = TableUpdateBodyValidator.parse(request.body);
    const params = TableUpdateParamValidator.parse(request.params);

    const result = await this.useCase.execute({
      ...params,
      ...payload,
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
