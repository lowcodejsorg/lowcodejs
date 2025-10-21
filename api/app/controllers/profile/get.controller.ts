/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import GetProfileUseCase from '@use-case/profile/get.use-case';

@Controller({
  route: 'profile',
})
export default class {
  constructor(
    private readonly useCase: GetProfileUseCase = getInstanceByToken(
      GetProfileUseCase,
    ),
  ) {}

  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        description:
          "Retrieves the authenticated user's profile information including personal data, group, and permissions.",
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            description: 'User profile retrieved successfully',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'User ID' },
              name: { type: 'string', description: 'User full name' },
              email: {
                type: 'string',
                format: 'email',
                description: 'User email address',
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive'],
                description: 'User account status',
              },
              group: {
                type: 'object',
                description: 'User group with populated permissions',
                properties: {
                  _id: { type: 'string', description: 'Group ID' },
                  name: { type: 'string', description: 'Group name' },
                  slug: { type: 'string', description: 'Group slug' },
                  description: {
                    type: 'string',
                    nullable: true,
                    description: 'Group description',
                  },
                  permissions: {
                    type: 'array',
                    description: 'Array of permissions assigned to this group',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', description: 'Permission ID' },
                        name: {
                          type: 'string',
                          description: 'Permission name',
                        },
                        slug: {
                          type: 'string',
                          description: 'Permission slug',
                        },
                        description: {
                          type: 'string',
                          nullable: true,
                          description: 'Permission description',
                        },
                      },
                    },
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Account creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last profile update timestamp',
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
          },
          404: {
            description: 'Not found - User profile not found',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['User not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['USER_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'User not found',
                code: 404,
                cause: 'USER_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['GET_USER_PROFILE_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const result = await this.useCase.execute({
      _id: request.user.sub,
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
