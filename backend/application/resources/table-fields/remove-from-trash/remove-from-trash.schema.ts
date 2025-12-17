import type { FastifySchema } from 'fastify';

export const TableFieldRemoveFromTrashSchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Remove field from trash',
  description:
    'Restores a field from trash by setting trashed=false and re-enabling listing and filtering properties. Updates table schema.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug containing the field',
        examples: ['users', 'products', 'blog-posts'],
      },
      _id: {
        type: 'string',
        description: 'Field ID to restore from trash',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description:
        'Field restored from trash successfully with updated configuration',
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
              description:
                'Field required status (remains false after restore)',
            },
            multiple: {
              type: 'boolean',
              description: 'Field accepts multiple values',
            },
            listing: {
              type: 'boolean',
              enum: [true],
              description: 'Field is now shown in list view',
            },
            filtering: {
              type: 'boolean',
              enum: [true],
              description: 'Field filtering is now enabled',
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
            'Field configuration with listing and filtering restored to true',
        },
        trashed: {
          type: 'boolean',
          enum: [false],
          description: 'Field is no longer in trash',
        },
        trashedAt: {
          type: 'string',
          nullable: true,
          description: 'Timestamp when field was trashed (now null)',
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
      description:
        'Not found - Table or field does not exist or is not in trash',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Table not found', 'Field not found'],
        },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'FIELD_NOT_FOUND'],
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
        cause: {
          type: 'string',
          enum: ['REMOVE_FIELD_FROM_TRASH_ERROR'],
        },
      },
    },
  },
};
