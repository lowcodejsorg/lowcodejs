import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { TableAccessMiddleware } from '@application/middlewares/table-access.middleware';

import { TableRowEvaluationSchema } from './evaluation.schema';
import TableRowEvaluationUseCase from './evaluation.use-case';
import {
  TableRowEvaluationBodyValidator,
  TableRowEvaluationParamValidator,
} from './evaluation.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowEvaluationUseCase = getInstanceByToken(
      TableRowEvaluationUseCase,
    ),
  ) {}

  @POST({
    url: '/:slug/rows/:_id/evaluation',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
        TableAccessMiddleware({
          requiredPermission: 'UPDATE_ROW',
          // Sem allowedGroups - usuário logado pode avaliar se puder ver
        }),
      ],
      schema: TableRowEvaluationSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = TableRowEvaluationBodyValidator.parse(request.body);
    const params = TableRowEvaluationParamValidator.parse(request.params);

    const result = await this.useCase.execute({
      ...payload,
      ...params,
      user: request.user.sub,
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
