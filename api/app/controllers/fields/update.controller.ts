/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import UpdateFieldUseCase from '@use-case/fields/update.use-case';
import {
  GetFieldCollectionByIdSchema,
  GetFieldCollectionParamsSchema,
  UpdateFieldCollectionSchema,
} from '@validators/field-collection.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: UpdateFieldUseCase = getInstanceByToken(
      UpdateFieldUseCase,
    ),
  ) {}

  @PUT({
    url: '/:slug/fields/:_id',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Fields'],
        summary: 'Update field',
        description:
          'Updates an existing field in a collection. Regenerates slug if name changed and rebuilds collection schema. Updates field references if slug changes.',
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
              description: 'Field ID to update',
              examples: ['507f1f77bcf86cd799439011'],
            },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['name', 'type', 'configuration'],
          properties: {
            name: {
              type: 'string',
              description: 'Field name (will be re-slugified if changed)',
              examples: [
                'Full Name Updated',
                'Product Price',
                'Published Date',
              ],
            },
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
              required: ['required', 'multiple'],
              properties: {
                required: {
                  type: 'boolean',
                  description: 'Field is required for data entry',
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
                  description: 'Options for DROPDOWN type',
                },
                relationship: {
                  type: 'object',
                  nullable: true,
                  description: 'Configuration for RELATIONSHIP type',
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
                  description: 'Configuration for FIELD_GROUP type',
                  properties: {
                    _id: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
                category: {
                  type: 'array',
                  nullable: true,
                  description: 'Categories for CATEGORY type',
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
            },
            trashed: {
              type: 'boolean',
              description: 'Set field as trashed',
              examples: [true, false],
            },
            trashedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Timestamp when field was trashed',
              examples: ['2023-01-01T00:00:00.000Z', null],
            },
          },
        },
        response: {
          200: {
            description:
              'Field updated successfully with updated configuration',
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
                  defaultValue: {
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
                  group: {
                    type: 'object',
                    nullable: true,
                    description: 'Field group configuration',
                    properties: {
                      _id: { type: 'string' },
                      slug: { type: 'string' },
                    },
                  },
                },
                description: 'Updated field configuration',
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
          400: {
            description: 'Bad request - Validation error',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Invalid field configuration',
                  'Required fields missing',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
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
          409: {
            description: 'Last active field, should not be sent to trash',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: ['Last active field, should not be sent to trash'],
              },
              code: { type: 'number', enum: [409] },
              cause: {
                type: 'string',
                enum: ['LAST_ACTIVE_FIELD'],
              },
            },
            examples: [
              {
                message: 'Last active field, should not be sent to trash',
                code: 409,
                cause: 'LAST_ACTIVE_FIELD',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: {
                type: 'string',
                enum: ['UPDATE_FIELD_COLLECTION_ERROR'],
              },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = UpdateFieldCollectionSchema.parse(request.body);
    const params = {
      ...GetFieldCollectionParamsSchema.parse(request.params),
      ...GetFieldCollectionByIdSchema.parse(request.params),
    };

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
