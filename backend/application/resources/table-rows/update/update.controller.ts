import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { TableAccessMiddleware } from '@application/middlewares/table-access.middleware';

import TableRowUpdateUseCase from './update.use-case';
import {
  TableRowUpdateBodyValidator,
  TableRowUpdateParamValidator,
} from './update.validator';

@Controller({
  route: 'tables',
})
export default class {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly useCase: TableRowUpdateUseCase = getInstanceByToken(
      TableRowUpdateUseCase,
    ),
  ) {}

  @PUT({
    url: '/:slug/rows/:_id',
    options: {
      onRequest: [
        AuthenticationMiddleware({
          optional: false,
        }),
        TableAccessMiddleware({
          requiredPermission: 'UPDATE_ROW',
        }),
      ],
      schema: {
        tags: ['Rows'],
        summary: 'Update row',
        description:
          'Updates an existing row in a table with dynamic schema based on table fields. Handles FIELD_GROUP types by updating nested table entries.',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['slug', '_id'],
          properties: {
            slug: {
              type: 'string',
              description: 'Table slug containing the row',
              examples: ['users', 'products', 'blog-posts'],
            },
            _id: {
              type: 'string',
              description: 'Row ID to update',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          description:
            'Dynamic row data based on table fields. Keys correspond to field slugs, values depend on field types.',
          additionalProperties: true,
          examples: [
            {
              name: 'John Doe Updated',
              email: 'john.updated@example.com',
              age: 31,
              active: false,
              tags: ['senior-developer', 'typescript'],
              profile_picture: ['507f1f77bcf86cd799439014'],
              related_products: ['507f1f77bcf86cd799439015'],
            },
          ],
          properties: {
            field_slug_example: {
              oneOf: [
                {
                  type: 'string',
                  description: 'For TEXT_SHORT, TEXT_LONG, DROPDOWN fields',
                },
                { type: 'number', description: 'For number-based fields' },
                { type: 'boolean', description: 'For boolean fields' },
                {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'For multiple values or FILE, RELATIONSHIP fields',
                },
                {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        description: 'Optional ID for FIELD_GROUP items',
                      },
                    },
                    additionalProperties: true,
                  },
                  description:
                    'For FIELD_GROUP fields - array of nested objects',
                },
                { type: 'object', description: 'For complex field types' },
              ],
            },
          },
        },
        response: {
          200: {
            description:
              'Row updated successfully with populated relationships',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Row ID' },
              trashed: { type: 'boolean', description: 'Is row in trash' },
              trashedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: 'When row was trashed',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Last update timestamp',
              },
            },
            additionalProperties: true,
          },
          400: {
            description:
              'Bad request - Validation error or field requirements not met',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Validation failed',
                  'Required field missing',
                  'Invalid field type',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: ['INVALID_PARAMETERS', 'VALIDATION_ERROR'],
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
            description: 'Not found - Table or row does not exist',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Table not found', 'Row not found'],
              },
              code: { type: 'number', enum: [404] },
              cause: {
                type: 'string',
                enum: ['TABLE_NOT_FOUND', 'ROW_NOT_FOUND'],
              },
            },
            examples: [
              {
                message: 'Row not found',
                code: 404,
                cause: 'ROW_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['UPDATE_ROW_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = TableRowUpdateBodyValidator.parse(request.body);
    const params = TableRowUpdateParamValidator.parse(request.params);
    const result = await this.useCase.execute({
      ...payload,
      ...params,
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
