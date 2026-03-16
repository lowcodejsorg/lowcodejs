import type { FastifySchema } from 'fastify';

export const TableFieldUpdateSchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Update field',
  description:
    'Updates an existing field in a table. Regenerates slug if name changed and rebuilds table schema. Updates field references if slug changes.',
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
        description: 'Field ID to update',
        examples: ['507f1f77bcf86cd799439011'],
      },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    required: ['name', 'type'],
    properties: {
      name: {
        type: 'string',
        description: 'Field name (will be re-slugified if changed)',
        examples: ['Full Name Updated', 'Product Price', 'Published Date'],
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
          'USER',
          'CREATOR',
          'IDENTIFIER',
          'CREATED_AT',
          'TRASHED',
          'TRASHED_AT',
        ],
        description: 'Field type from FIELD_TYPE enum',
      },
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
      showInFilter: {
        type: 'boolean',
        default: false,
        description: 'Allow filtering by this field',
      },
      showInForm: {
        type: 'boolean',
        default: false,
        description: 'Show field in create/edit forms',
      },
      showInDetail: {
        type: 'boolean',
        default: false,
        description: 'Show field in detail pages',
      },
      showInList: {
        type: 'boolean',
        default: false,
        description: 'Show field in list/grid/kanban views',
      },
      widthInForm: {
        type: 'number',
        nullable: true,
        default: 50,
        description: 'Field width in forms, integer 0-100 (%)',
      },
      widthInList: {
        type: 'number',
        nullable: true,
        default: 10,
        description: 'Field width in list/grid views, integer 0-100 (px)',
      },
      locked: {
        type: 'boolean',
        default: false,
        description: 'Field is locked and cannot be modified',
      },
      format: {
        type: 'string',
        nullable: true,
        default: null,
        description: 'Field format',
      },
      defaultValue: {
        type: 'string',
        nullable: true,
        default: null,
        description: 'Default field value',
      },
      dropdown: {
        type: 'array',
        nullable: true,
        default: [],
        description: 'Options for DROPDOWN type',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            color: { type: 'string' },
          },
        },
      },
      relationship: {
        type: 'object',
        nullable: true,
        default: null,
        description: 'Configuration for RELATIONSHIP type',
        properties: {
          table: {
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
        anyOf: [
          { type: 'null' },
          { type: 'string', description: 'Group slug' },
          {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              slug: { type: 'string' },
            },
          },
        ],
        default: null,
        description: 'Configuration for FIELD_GROUP type (slug or object)',
      },
      category: {
        type: 'array',
        nullable: true,
        default: [],
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
      description: 'Field updated successfully',
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
            'USER',
            'CREATOR',
            'IDENTIFIER',
            'CREATED_AT',
            'TRASHED',
            'TRASHED_AT',
          ],
          description: 'Field type',
        },
        required: { type: 'boolean', description: 'Field is required' },
        multiple: {
          type: 'boolean',
          description: 'Field accepts multiple values',
        },
        showInFilter: {
          type: 'boolean',
          description: 'Allow filtering by this field',
        },
        showInForm: {
          type: 'boolean',
          description: 'Show field in create/edit forms',
        },
        showInDetail: {
          type: 'boolean',
          description: 'Show field in detail pages',
        },
        showInList: {
          type: 'boolean',
          description: 'Show field in list/grid/kanban views',
        },
        widthInForm: {
          type: 'number',
          nullable: true,
          description: 'Field width in forms, integer 0-100 (%)',
        },
        widthInList: {
          type: 'number',
          nullable: true,
          description: 'Field width in list/grid views, integer 0-100 (px)',
        },
        locked: { type: 'boolean', description: 'Field is locked' },
        native: { type: 'boolean', description: 'Field is native' },
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
          nullable: true,
          description: 'Dropdown options',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              color: { type: 'string' },
            },
          },
        },
        relationship: {
          type: 'object',
          nullable: true,
          description: 'Relationship configuration',
          properties: {
            table: {
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
          enum: ['Invalid field configuration', 'Required fields missing'],
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
      description: 'Not found - Table or field does not exist',
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
          enum: ['UPDATE_FIELD_TABLE_ERROR'],
        },
      },
    },
  },
};
