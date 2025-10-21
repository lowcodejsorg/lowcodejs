/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PATCH } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import SendFieldToTrashUseCase from '@use-case/fields/send-to-trash.use-case';
import {
  GetFieldCollectionByIdSchema,
  GetFieldCollectionParamsSchema,
} from '@validators/field-collection.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: SendFieldToTrashUseCase = getInstanceByToken(
      SendFieldToTrashUseCase,
    ),
  ) {}

  @PATCH({
    url: '/:slug/fields/:_id/trash',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Fields'],
        summary: 'Send field to trash',
        description:
          'Moves a field to trash by setting trashed=true and disabling listing, filtering, and required properties. Updates collection schema.',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['slug', '_id'],
          properties: {
            slug: {
              type: 'string',
              description: 'Collection slug containing the field',
              examples: ['users', 'products', 'blog-posts'],
            },
            _id: {
              type: 'string',
              description: 'Field ID to move to trash',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description:
              'Field moved to trash successfully with updated configuration',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Field ID' },
              name: { type: 'string', description: 'Field name' },
              slug: { type: 'string', description: 'Field slug' },
              type: {
                type: 'string',
                enum: [
                  'TEXT_SHORT',
                  'TEXT_LONG',
                  'DROPDOWN',
                  'DATE',
                  'RELATIONSHIP',
                  'FILE',
                  'FIELD_GROUP',
                  'REACTION',
                  'EVALUATION',
                  'CATEGORY',
                ],
                description: 'Field type',
              },
              configuration: {
                type: 'object',
                properties: {
                  required: {
                    type: 'boolean',
                    enum: [false],
                    description: 'Field is no longer required when trashed',
                  },
                  multiple: {
                    type: 'boolean',
                    description: 'Field accepts multiple values',
                  },
                  listing: {
                    type: 'boolean',
                    enum: [false],
                    description:
                      'Field no longer shown in list view when trashed',
                  },
                  filtering: {
                    type: 'boolean',
                    enum: [false],
                    description: 'Field filtering disabled when trashed',
                  },
                  format: {
                    type: 'string',
                    nullable: true,
                    description: 'Field format',
                  },
                  default_value: {
                    type: 'string',
                    nullable: true,
                    description: 'Default field value',
                  },
                  dropdown: {
                    type: 'array',
                    items: { type: 'string' },
                    nullable: true,
                    description: 'Dropdown options',
                  },
                  relationship: {
                    type: 'object',
                    nullable: true,
                    description: 'Relationship configuration',
                  },
                  group: {
                    type: 'object',
                    nullable: true,
                    description: 'Field group configuration',
                  },
                  category: {
                    type: 'array',
                    nullable: true,
                    description: 'Category options',
                  },
                },
                description:
                  'Field configuration with listing, filtering, and required set to false',
              },
              trashed: {
                type: 'boolean',
                enum: [true],
                description: 'Field is now in trash',
              },
              trashedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Timestamp when field was moved to trash',
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
            description: 'Not found - Collection or field does not exist',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Collection not found', 'Field not found'],
              },
              code: { type: 'number', enum: [404] },
              cause: {
                type: 'string',
                enum: ['COLLECTION_NOT_FOUND', 'FIELD_NOT_FOUND'],
              },
            },
            examples: [
              {
                message: 'Field not found',
                code: 404,
                cause: 'FIELD_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['SEND_FIELD_TO_TRASH_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = {
      ...GetFieldCollectionParamsSchema.parse(request.params),
      ...GetFieldCollectionByIdSchema.parse(request.params),
    };

    const result = await this.useCase.execute(params);

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
