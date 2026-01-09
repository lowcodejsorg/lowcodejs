import type { FastifySchema } from 'fastify';

export const TableCreateSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Create a new table',
  description:
    'Create a new table with fields, configuration and permissions settings',
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        description: 'Table name',
      },
    },
  },
  response: {
    201: {
      description: 'Table created successfully',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Table ID' },
        name: { type: 'string', description: 'Table name' },
        description: {
          type: 'string',
          nullable: true,
          description: 'Table description',
        },
        slug: { type: 'string', description: 'Table slug' },
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
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Field ID' },
              name: { type: 'string', description: 'Field name' },
              slug: {
                type: 'string',
                description: 'Field slug (generated from name)',
              },
              type: {
                type: 'string',
                description: 'Field type from FIELD_TYPE enum',
              },
              configuration: {
                type: 'object',
                description: 'Field configuration',
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
          description: 'Table fields (processed with slugs)',
        },
        configuration: {
          type: 'object',
          properties: {
            style: { type: 'string', enum: ['gallery', 'list', 'document'] },
            visibility: {
              type: 'string',
              enum: ['public', 'restricted', 'open', 'form', 'private'],
            },
            collaboration: {
              type: 'string',
              enum: ['open', 'restricted'],
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
                orderList: { type: 'array', items: { type: 'string' } },
                orderForm: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          description: 'Table configuration with populated owner',
        },
        type: {
          type: 'string',
          enum: ['table', 'field-group'],
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
          description: 'Is Table in trash',
        },
        trashedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          description: 'When Table was trashed',
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    400: {
      description: 'Bad request - Owner required or validation error',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: [
            'Owner required',
            'Invalid Table name',
            'Invalid field configuration',
            'Required fields missing',
          ],
        },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: [
            'OWNER_REQUIRED',
            'INVALID_PARAMETERS',
            'INVALID_FIELD_CONFIG',
          ],
        },
      },
      examples: [
        {
          message: 'Owner required',
          code: 400,
          cause: 'OWNER_REQUIRED',
        },
        {
          message: 'Invalid Table name',
          code: 400,
          cause: 'INVALID_PARAMETERS',
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
    409: {
      description: 'Conflict - Table with this name already exists',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Table already exists'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['TABLE_ALREADY_EXISTS'] },
      },
      examples: [
        {
          message: 'Table already exists',
          code: 409,
          cause: 'TABLE_ALREADY_EXISTS',
        },
      ],
    },
    500: {
      description: 'Internal server error - Database or server issues',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['CREATE_TABLE_ERROR'] },
      },
    },
  },
};
