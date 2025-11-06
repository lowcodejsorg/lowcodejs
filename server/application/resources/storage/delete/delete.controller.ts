import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, getInstanceByToken } from 'fastify-decorators';
import z from 'zod';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { StorageDeleteSchema } from './delete.schema';
import StorageDeleteUseCase from './delete.use-case';

const Schema = z.object({
  _id: z.string(),
});

@Controller({
  route: '/storage',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: StorageDeleteUseCase = getInstanceByToken(
      StorageDeleteUseCase,
    ),
  ) {}

  @DELETE({
    url: '/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: StorageDeleteSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = Schema.parse(request.params);

    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send({
      message: 'File deleted successfully',
      deletedAt: new Date().toISOString(),
    });
  }
}
