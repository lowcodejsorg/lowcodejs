/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import GetFieldByIdUseCase from '@use-case/fields/get-by-id.use-case';
import {
  GetFieldCollectionByIdSchema,
  GetFieldCollectionParamsSchema,
} from '@validators/field-collection.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: GetFieldByIdUseCase = getInstanceByToken(
      GetFieldByIdUseCase,
    ),
  ) {}

  @GET({
    url: '/:slug/fields/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Fields'],
        summary: 'Get field by ID',
        description:
          'Retrieves a specific field by its ID from a collection. Returns complete field configuration and metadata.',
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
              description: 'Field ID to retrieve',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            description:
              'Field retrieved successfully with complete configuration',
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
                description: 'Field type from FIELD_TYPE enum',
              },
              configuration: {
                type: 'object',
                properties: {
                  required: {
                    type: 'boolean',
                    description: 'Field is required',
                  },
                  multiple: {
                    type: 'boolean',
                    description: 'Field accepts multiple values',
                  },
                  listing: {
                    type: 'boolean',
                    description: 'Show field in list view',
                  },
                  filtering: {
                    type: 'boolean',
                    description: 'Allow filtering by this field',
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
                    properties: {
                      collection: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          slug: { type: 'string' },
                        },
                      },
                      field: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          slug: { type: 'string' },
                        },
                      },
                      order: { type: 'string', enum: ['asc', 'desc'] },
                    },
                  },
                  group: {
                    type: 'object',
                    nullable: true,
                    description: 'Field group configuration',
                    properties: {
                      _id: { type: 'string' },
                      slug: { type: 'string' },
                    },
                  },
                  category: {
                    type: 'array',
                    nullable: true,
                    description: 'Category options',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        children: { type: 'array' },
                      },
                    },
                  },
                },
                description: 'Complete field configuration',
              },
              trashed: { type: 'boolean', description: 'Is field in trash' },
              trashedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: 'When field was trashed',
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
                message: 'Collection not found',
                code: 404,
                cause: 'COLLECTION_NOT_FOUND',
              },
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
              cause: { type: 'string', enum: ['GET_FIELD_BY_ID_ERROR'] },
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
