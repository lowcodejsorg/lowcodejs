import { Controller, POST } from 'fastify-decorators';

import CloneTableUseCase from './clone-table.use-case';
import { CloneTableValidator } from './clone-table.validator';

@Controller({
  route: '/tools',
})
export default class CloneTableController {
  private readonly useCase = new CloneTableUseCase();

  @POST({
    url: '/clone-table',
  })
  async handler(request: any, reply: any) {

    const payload = CloneTableValidator.parse(request.body);

    const result = await this.useCase.execute(payload);

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
