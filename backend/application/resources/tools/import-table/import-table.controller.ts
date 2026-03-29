/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { ImportTableSchema } from './import-table.schema';
import ImportTableUseCase from './import-table.use-case';
import { ImportTableValidator } from './import-table.validator';

@Controller({
  route: '/tools',
})
export default class {
  constructor(
    private readonly useCase: ImportTableUseCase = getInstanceByToken(
      ImportTableUseCase,
    ),
  ) {}

  @POST({
    url: '/import-table',
    options: {
      bodyLimit: 50 * 1024 * 1024, // 50MB
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: ImportTableSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = ImportTableValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...body,
      ownerId: request.user.sub,
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

    return response.status(201).send(result.value);
  }
}
