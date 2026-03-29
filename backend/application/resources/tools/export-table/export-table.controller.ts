/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { ExportTableSchema } from './export-table.schema';
import ExportTableUseCase from './export-table.use-case';
import { ExportTableValidator } from './export-table.validator';

@Controller({
  route: '/tools',
})
export default class {
  constructor(
    private readonly useCase: ExportTableUseCase = getInstanceByToken(
      ExportTableUseCase,
    ),
  ) {}

  @POST({
    url: '/export-table',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: ExportTableSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = ExportTableValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...body,
      userId: request.user.sub,
      userName: request.user.email,
    });

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        ...(error.errors && { errors: error.errors }),
      });
    }

    return response.status(200).send(result.value);
  }
}
