/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import UpdateProfileUseCase from '@use-case/profile/update.use-case';
import { UpdateUserProfileSchema } from '@validators/users';

@Controller({
  route: 'profile',
})
export default class {
  constructor(
    private readonly useCase: UpdateProfileUseCase = getInstanceByToken(
      UpdateProfileUseCase,
    ),
  ) {}

  @PUT({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Profile'],
        summary: 'Update current user profile',
        description:
          "Updates the authenticated user's profile information including personal data and optionally password change.",
        security: [{ cookieAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'email', 'group'],
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
              examples: ['John Doe', 'Maria Silva'],
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              examples: ['john@example.com', 'maria@example.com'],
            },
            group: {
              type: 'string',
              description: 'User group ID',
              examples: ['507f1f77bcf86cd799439011'],
            },
            allowPasswordChange: {
              type: 'boolean',
              default: false,
              description:
                'Enable password change (if true, currentPassword and newPassword are required)',
            },
            currentPassword: {
              type: 'string',
              description:
                'Current password (required when allowPasswordChange is true)',
              examples: ['currentPassword123'],
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              description:
                'New password (required when allowPasswordChange is true)',
              examples: ['newPassword123'],
            },
          },
        },
        response: {
          200: {
            description: 'Profile updated successfully',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'User ID' },
              name: { type: 'string', description: 'Updated user name' },
              email: {
                type: 'string',
                format: 'email',
                description: 'Updated user email',
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive'],
                description: 'User status',
              },
              group: {
                type: 'object',
                description: 'Updated user group with populated permissions',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        description: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Profile update timestamp',
              },
            },
          },
          400: {
            description:
              'Bad request - Validation error or missing required fields',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Group not informed',
                  'Invalid password',
                  'Validation error',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: ['GROUP_NOT_INFORMED', 'INVALID_PARAMETERS'],
              },
            },
            examples: [
              {
                message: 'Group not informed',
                code: 400,
                cause: 'GROUP_NOT_INFORMED',
              },
            ],
          },
          401: {
            description:
              'Unauthorized - Authentication required or invalid current password',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Unauthorized', 'Invalid credentials'],
              },
              code: { type: 'number', enum: [401] },
              cause: {
                type: 'string',
                enum: ['AUTHENTICATION_REQUIRED', 'INVALID_CREDENTIALS'],
              },
            },
            examples: [
              {
                message: 'Invalid credentials',
                code: 401,
                cause: 'INVALID_CREDENTIALS',
              },
            ],
          },
          404: {
            description: 'Not found - User profile not found',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['User not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['USER_NOT_FOUND'] },
            },
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['UPDATE_USER_PROFILE_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = UpdateUserProfileSchema.parse(request.body);

    // @ts-ignore
    const result = await this.useCase.execute(body);

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
