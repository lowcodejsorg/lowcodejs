/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import ListUserGroupUseCase from '@use-case/user-group/list.use-case';

@Controller({
  route: 'user-group',
})
export default class {
  constructor(
    private readonly useCase: ListUserGroupUseCase = getInstanceByToken(
      ListUserGroupUseCase,
    ),
  ) {}

  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['User Group'],
        summary: 'List all user groups',
        description:
          'Retrieves a complete list of all user groups without pagination',
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            description: 'Complete list of user groups',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          401: {
            description: 'Unauthorized - Authentication required',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Authentication required'] },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
            examples: [
              {
                message: 'Authentication required',
                code: 401,
                cause: 'AUTHENTICATION_REQUIRED',
              },
            ],
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['INTERNAL_SERVER_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'INTERNAL_SERVER_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const result = await this.useCase.execute();

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
