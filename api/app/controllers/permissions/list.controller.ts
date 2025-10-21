/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import ListPermissionsUseCase from '@use-case/permissions/list.use-case';

@Controller({
  route: 'permissions',
})
export default class {
  constructor(
    private readonly useCase: ListPermissionsUseCase = getInstanceByToken(
      ListPermissionsUseCase,
    ),
  ) {}

  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Permissions'],
        summary: 'List permissions',
        description: 'Get list of all available permissions in the system',
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            description: 'List of all permissions',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          401: {
            description: 'Unauthorized - Authentication required',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Unauthorized'] },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
            examples: [
              {
                message: 'Unauthorized',
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
              cause: { type: 'string', enum: ['LIST_PERMISSIONS_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'LIST_PERMISSIONS_ERROR',
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
