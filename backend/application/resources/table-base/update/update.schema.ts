import { FastifySchema } from 'fastify';

export const TableUpdateSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Update table',
  description:
    'Updates an existing table with new data, fields, and configuration settings',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug identifier',
        examples: ['users', 'products', 'blog-posts'],
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['name', 'configuration'],
    properties: {
      name: {
        type: 'string',
        description: 'Table name',
      },
      description: {
        type: 'string',
        nullable: true,
        description: 'Table description',
      },
      logo: {
        type: 'string',
        nullable: true,
        description: 'Table logo URL or storage ID',
      },
      configuration: {
        type: 'object',
        required: ['style', 'visibility', 'collaboration'],
        properties: {
          style: {
            type: 'string',
            enum: ['GALLERY', 'LIST', 'DOCUMENT', 'CARD', 'MOSAIC'],
            default: 'LIST',
            description: 'Display style',
          },
          visibility: {
            type: 'string',
            enum: ['PUBLIC', 'RESTRICTED', 'OPEN', 'FORM', 'PRIVATE'],
            default: 'PUBLIC',
            description: 'Visibility setting',
          },
          collaboration: {
            type: 'string',
            enum: ['OPEN', 'RESTRICTED'],
            default: 'OPEN',
            description: 'Collaboration setting',
          },
          administrators: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of administrator user IDs',
          },
          fields: {
            type: 'object',
            required: ['orderList', 'orderForm'],
            properties: {
              orderList: {
                type: 'array',
                items: { type: 'string' },
                default: [],
                description: 'Field order for list view',
              },
              orderForm: {
                type: 'array',
                items: { type: 'string' },
                default: [],
                description: 'Field order for form view',
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
  },
  response: {
    200: {
      description: 'Table updated successfully',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Table ID' },
        name: { type: 'string', description: 'Table name' },
        description: {
          type: 'string',
          nullable: true,
          description: 'Table description',
        },
        slug: { type: 'string', description: 'Table URL slug' },
        logo: {
          type: 'object',
          nullable: true,
          description: 'Table logo storage details (populated)',
          properties: {
            _id: { type: 'string', description: 'Storage ID' },
            url: { type: 'string', description: 'File URL' },
            filename: {
              type: 'string',
              description: 'Original filename',
            },
            type: { type: 'string', description: 'MIME type' },
          },
        },
        fields: {
          type: 'array',
          description: 'Table fields',
          items: {
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
                description: 'Field configuration',
                additionalProperties: true,
              },
              trashed: {
                type: 'boolean',
                description: 'Is field in trash',
              },
              trashedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: 'When field was trashed',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        configuration: {
          type: 'object',
          description: 'Table configuration settings',
          properties: {
            style: {
              type: 'string',
              enum: ['GALLERY', 'LIST', 'DOCUMENT', 'CARD', 'MOSAIC'],
              description: 'Display style',
            },
            visibility: {
              type: 'string',
              enum: ['PUBLIC', 'RESTRICTED', 'OPEN', 'FORM', 'PRIVATE'],
              description: 'Visibility setting',
            },
            collaboration: {
              type: 'string',
              enum: ['OPEN', 'RESTRICTED'],
              description: 'Collaboration setting',
            },
            administrators: {
              type: 'array',
              description: 'Administrator users (populated)',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', description: 'User ID' },
                  name: { type: 'string', description: 'User name' },
                },
              },
            },
            owner: {
              type: 'object',
              description: 'Table owner (populated)',
              properties: {
                _id: { type: 'string', description: 'User ID' },
                name: { type: 'string', description: 'User name' },
              },
            },
            fields: {
              type: 'object',
              properties: {
                orderList: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Field order for list view',
                },
                orderForm: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Field order for form view',
                },
              },
            },
          },
        },
        type: {
          type: 'string',
          enum: ['TABLE', 'FIELD_GROUP'],
          description: 'Table type',
        },
        methods: {
          type: 'object',
          properties: {
            beforeSave: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  nullable: true,
                  description: 'Code to execute before saving',
                },
              },
            },
            afterSave: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  nullable: true,
                  description: 'Code to execute after saving',
                },
              },
            },
            onLoad: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  nullable: true,
                  description: 'Code to execute before saving',
                },
              },
            },
          },
          description: 'Table methods configuration',
        },
        _schema: {
          type: 'object',
          description:
            'Generated MongoDB schema based on fields with trashedAt and trashed properties',
          additionalProperties: true,
        },
        trashed: {
          type: 'boolean',
          description: 'Is table in trash',
        },
        trashedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          description: 'When table was trashed',
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
            'Invalid table name',
            'Invalid field configuration',
            'Required fields missing',
          ],
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PARAMETERS', 'INVALID_FIELD_CONFIG'],
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
      description: 'Not found - Table with specified slug does not exist',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Table not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Table not found',
          code: 404,
          cause: 'TABLE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['UPDATE_TABLE_ERROR'] },
      },
    },
  },
};
