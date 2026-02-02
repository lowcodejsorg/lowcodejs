/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';

import { CloneTableSchema } from './clone-table.schema';
import CloneTableUseCase from './clone-table.use-case';
import { CloneTableValidator } from './clone-table.validator';

@Controller({
  route: '/tools',
})
export default class {
  constructor(
    private readonly useCase: CloneTableUseCase = getInstanceByToken(
      CloneTableUseCase,
    ),
  ) {}

  @POST({
    url: '/clone-table',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
      ],
      schema: CloneTableSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = CloneTableValidator.parse(request.body);

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
      });
    }

    const { table, fieldIdMap } = result.value;

    return response.status(201).send({
      tableId: table._id,
      slug: table.slug,
      fieldIdMap,
    });
  }
}
