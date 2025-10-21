/* eslint-disable no-unused-vars */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import CreateFieldUseCase from '@use-case/fields/create.use-case';
import {
  CreateFieldCollectionSchema,
  GetFieldCollectionParamsSchema,
} from '@validators/field-collection.validator';

@Controller({
  route: 'collections',
})
export default class {
  constructor(
    private readonly useCase: CreateFieldUseCase = getInstanceByToken(
      CreateFieldUseCase,
    ),
  ) {}

  @POST({
    url: '/:slug/fields',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Fields'],
        summary: 'Create field',
        description:
          'Creates a new field in a collection. Automatically generates slug from name and rebuilds collection schema. For FIELD_GROUP type, creates a new collection.',
        security: [{ cookieAuth: [] }],
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: {
              type: 'string',
              description: 'Collection slug where the field will be created',
              examples: ['users', 'products', 'blog-posts'],
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
              description: 'Field name (will be slugified for internal use)',
              examples: ['Full Name', 'Product Price', 'Published Date'],
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
                  default: false,
                  description: 'Field is required for data entry',
                },
                multiple: {
                  type: 'boolean',
                  default: false,
                  description: 'Field accepts multiple values',
                },
                listing: {
                  type: 'boolean',
                  default: false,
                  description: 'Show field in list view',
                },
                filtering: {
                  type: 'boolean',
                  default: false,
                  description: 'Allow filtering by this field',
                },
                format: {
                  type: 'string',
                  nullable: true,
                  default: null,
                  description:
                    'Field format (for TEXT_SHORT: ALPHA_NUMERIC, INTEGER, DECIMAL, URL, EMAIL; for DATE: various date formats)',
                  examples: ['EMAIL', 'dd/MM/yyyy', 'DECIMAL'],
                },
                default_value: {
                  type: 'string',
                  nullable: true,
                  default: null,
                  description: 'Default field value',
                },
                dropdown: {
                  type: 'array',
                  items: { type: 'string' },
                  nullable: true,
                  default: null,
                  description: 'Options for DROPDOWN type fields',
                },
                relationship: {
                  type: 'object',
                  nullable: true,
                  default: null,
                  description: 'Configuration for RELATIONSHIP type',
                  properties: {
                    collection: {
                      type: 'object',
                      required: ['_id', 'slug'],
                      properties: {
                        _id: {
                          type: 'string',
                          description: 'Target collection ID',
                        },
                        slug: {
                          type: 'string',
                          description: 'Target collection slug',
                        },
                      },
                    },
                    field: {
                      type: 'object',
                      required: ['_id', 'slug'],
                      properties: {
                        _id: { type: 'string', description: 'Target field ID' },
                        slug: {
                          type: 'string',
                          description: 'Target field slug',
                        },
                      },
                    },
                    order: {
                      type: 'string',
                      enum: ['asc', 'desc'],
                      default: 'asc',
                      description: 'Sort order for relationship data',
                    },
                  },
                },
                group: {
                  type: 'object',
                  nullable: true,
                  default: null,
                  description:
                    'Configuration for FIELD_GROUP type (auto-populated on creation)',
                  properties: {
                    _id: {
                      type: 'string',
                      description: 'Field group collection ID',
                    },
                    slug: {
                      type: 'string',
                      description: 'Field group collection slug',
                    },
                  },
                },
                category: {
                  type: 'array',
                  nullable: true,
                  default: null,
                  description: 'Categories for CATEGORY type',
                  items: {
                    type: 'object',
                    required: ['id', 'label'],
                    properties: {
                      id: { type: 'string', description: 'Category ID' },
                      label: { type: 'string', description: 'Category label' },
                      children: {
                        type: 'array',
                        description: 'Nested categories',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        response: {
          201: {
            description:
              'Field created successfully with generated slug and updated collection schema',
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Field ID' },
              name: { type: 'string', description: 'Field name' },
              slug: { type: 'string', description: 'Generated field slug' },
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
                description:
                  'Field configuration with populated group if FIELD_GROUP type',
              },
              trashed: {
                type: 'boolean',
                enum: [false],
                description: 'Field is not trashed',
              },
              trashedAt: {
                type: 'string',
                nullable: true,
                description: 'When field was trashed (null for new fields)',
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
            description:
              'Bad request - Field already exists in collection or validation error',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Field already exist',
                  'Invalid field configuration',
                  'Required fields missing',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: ['FIELD_ALREADY_EXIST', 'INVALID_PARAMETERS'],
              },
            },
            examples: [
              {
                message: 'Field already exist',
                code: 400,
                cause: 'FIELD_ALREADY_EXIST',
              },
            ],
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
            description:
              'Not found - Collection with specified slug does not exist',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Collection not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['COLLECTION_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'Collection not found',
                code: 404,
                cause: 'COLLECTION_NOT_FOUND',
              },
            ],
          },
          500: {
            description: 'Internal server error - Database or server issues',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['CREATE_FIELD_ERROR'] },
            },
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = CreateFieldCollectionSchema.parse(request.body);
    const params = GetFieldCollectionParamsSchema.parse(request.params);
    const result = await this.useCase.execute({ ...payload, ...params });

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(201).send(result.value);
  }
}
