import { Controller, POST } from 'fastify-decorators';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Inject, Service } from 'typedi';

import CloneTableUseCase from './clone-table.use-case';
import { CloneTableValidator } from './clone-table.validator';
import { CloneTableSchema } from './clone-table.schema';

@Service()
@Controller({
  route: '/tools',
})
export default class CloneTableController {
  constructor(
    @Inject(() => CloneTableUseCase)
    private readonly useCase: CloneTableUseCase,
  ) {}

  @POST({
    url: '/clone-table',
    schema: CloneTableSchema,
  })
  async handler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const payload = CloneTableValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...payload,
      ownerId: request.user.sub,
    });

    if (result.isLeft()) {
      const error = result.value;

      return reply.code(error.code).send({
        message: error.message,
        cause: error.cause,
        code: error.code,
      });
    }

    const { table, fieldIdMap } = result.value;

    return reply.send({
      tableId: table._id,
      slug: table.slug,
      fieldIdMap,
    });
  }
}
