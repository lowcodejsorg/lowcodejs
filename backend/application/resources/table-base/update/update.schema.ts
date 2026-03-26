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
    required: ['name', 'style', 'visibility', 'collaboration'],
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
      style: {
        type: 'string',
        enum: [
          'GALLERY',
          'LIST',
          'DOCUMENT',
          'CARD',
          'MOSAIC',
          'KANBAN',
          'FORUM',
          'CALENDAR',
          'GANTT',
        ],
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
      fieldOrderList: {
        type: 'array',
        items: { type: 'string' },
        default: [],
        description: 'Field order for list view',
      },
      fieldOrderForm: {
        type: 'array',
        items: { type: 'string' },
        default: [],
        description: 'Field order for form view',
      },
      order: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            required: ['field', 'direction'],
            properties: {
              field: { type: 'string', description: 'Field slug to sort by' },
              direction: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Sort direction',
              },
            },
          },
        ],
        default: null,
        description: 'Default sort order for table records',
      },
      methods: {
        type: 'object',
        description: 'Table methods configuration',
      },
      layoutFields: {
        type: 'object',
        description: 'Layout fields configuration',
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
              required: { type: 'boolean', description: 'Is field required' },
              multiple: {
                type: 'boolean',
                description: 'Allows multiple values',
              },
              format: {
                type: 'string',
                nullable: true,
                description: 'Field format validation',
              },
              showInList: {
                type: 'boolean',
                description: 'Show in listings',
              },
              showInForm: { type: 'boolean', description: 'Show in form view' },
              showInDetail: {
                type: 'boolean',
                description: 'Show in detail view',
              },
              showInFilter: { type: 'boolean', description: 'Allow filtering' },
              widthInForm: {
                type: 'number',
                nullable: true,
                description: 'Field width in forms, integer 0-100 (%)',
              },
              widthInList: {
                type: 'number',
                nullable: true,
                description:
                  'Field width in list/grid views, integer 0-100 (px)',
              },
              widthInDetail: {
                type: 'number',
                nullable: true,
                description: 'Field width in detail views, integer 0-100 (%)',
              },
              locked: {
                type: 'boolean',
                description: 'Field is locked and cannot be modified',
              },
              native: {
                type: 'boolean',
                description: 'Field is native',
              },
              defaultValue: {
                type: 'string',
                nullable: true,
                description: 'Default field value',
              },
              relationship: {
                type: 'object',
                nullable: true,
                description: 'Relationship configuration',
              },
              dropdown: {
                type: 'array',
                nullable: true,
                description: 'Dropdown options',
              },
              category: {
                type: 'array',
                nullable: true,
                description: 'Category options',
              },
              group: {
                type: 'object',
                nullable: true,
                description: 'Field group configuration',
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
        style: {
          type: 'string',
          enum: [
            'GALLERY',
            'LIST',
            'DOCUMENT',
            'CARD',
            'MOSAIC',
            'KANBAN',
            'FORUM',
            'CALENDAR',
            'GANTT',
          ],
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
        fieldOrderList: {
          type: 'array',
          items: { type: 'string' },
          description: 'Field order for list view',
        },
        fieldOrderForm: {
          type: 'array',
          items: { type: 'string' },
          description: 'Field order for form view',
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
        groups: {
          type: 'array',
          description: 'Field groups configuration',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Group slug' },
              name: { type: 'string', description: 'Group name' },
              fields: {
                type: 'array',
                description: 'Fields within the group',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    multiple: { type: 'boolean' },
                    format: { type: 'string', nullable: true },
                    showInList: { type: 'boolean' },
                    showInForm: { type: 'boolean' },
                    showInDetail: { type: 'boolean' },
                    showInFilter: { type: 'boolean' },
                    widthInForm: { type: 'number', nullable: true },
                    widthInList: { type: 'number', nullable: true },
                    widthInDetail: { type: 'number', nullable: true },
                    locked: { type: 'boolean' },
                    native: { type: 'boolean' },
                    defaultValue: { type: 'string', nullable: true },
                    relationship: { type: 'object', nullable: true },
                    dropdown: { type: 'array', nullable: true },
                    category: { type: 'array', nullable: true },
                    group: { type: 'object', nullable: true },
                    trashed: { type: 'boolean' },
                    trashedAt: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true,
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                  additionalProperties: true,
                },
              },
              _schema: {
                type: 'object',
                description: 'Group schema',
                additionalProperties: true,
              },
            },
          },
        },
        order: {
          type: 'object',
          description: 'Default sort order for table records',
          properties: {
            field: { type: 'string', nullable: true },
            direction: {
              type: 'string',
              enum: ['asc', 'desc'],
              nullable: true,
            },
          },
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
    409: {
      description: 'Conflict - Table with the generated slug already exists',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Table already exists'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['TABLE_ALREADY_EXISTS'] },
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
