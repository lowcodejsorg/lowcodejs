import type { FastifySchema } from 'fastify';

export const TableRemoveFromTrashSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Remove table from trash',
  description:
    'Restores a table from trash, making it active again with all its original functionality.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'table slug identifier',
        examples: ['users', 'products', 'blog-posts'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'table restored from trash successfully with populated data',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'table ID' },
        name: { type: 'string', description: 'table name' },
        description: {
          type: 'string',
          nullable: true,
          description: 'table description',
        },
        slug: { type: 'string', description: 'table URL slug' },
        logo: {
          type: 'object',
          nullable: true,
          description: 'table logo storage details (populated)',
          properties: {
            _id: { type: 'string', description: 'Storage ID' },
            url: { type: 'string', description: 'File URL' },
            filename: {
              type: 'string',
              description: 'Original filename',
            },
          },
        },
        fields: {
          type: 'array',
          description: 'table fields (populated)',
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
                description: 'Field type from FIELD_TYPE enum',
              },
              configuration: {
                type: 'object',
                description:
                  'Field configuration including required, multiple, format, etc.',
                properties: {
                  required: {
                    type: 'boolean',
                    description: 'Is field required',
                  },
                  multiple: {
                    type: 'boolean',
                    description: 'Allows multiple values',
                  },
                  format: {
                    type: 'string',
                    nullable: true,
                    enum: ['email', 'phone', 'url', 'color', 'password'],
                    description: 'Field format validation',
                  },
                  listing: {
                    type: 'boolean',
                    description: 'Show in listings',
                  },
                  filtering: {
                    type: 'boolean',
                    description: 'Allow filtering',
                  },
                  default_value: {
                    type: 'string',
                    nullable: true,
                    description: 'Default field value',
                  },
                  relationship: {
                    type: 'object',
                    nullable: true,
                    description:
                      'Relationship configuration for RELATIONSHIP fields',
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
                  dropdown: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Dropdown options for DROPDOWN fields',
                  },
                  category: {
                    type: 'array',
                    description: 'Category tree for CATEGORY fields',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        children: { type: 'array', items: {} },
                      },
                    },
                  },
                  group: {
                    type: 'object',
                    nullable: true,
                    description: 'Field group configuration',
                    properties: {
                      _id: { type: 'string', nullable: true },
                      slug: { type: 'string', nullable: true },
                    },
                  },
                },
                additionalProperties: false,
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
              description: 'table owner (populated)',
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
          description: 'table type',
        },
        _schema: {
          type: 'object',
          description:
            'Generated MongoDB schema based on fields with trashedAt and trashed properties',
          additionalProperties: true,
        },
        trashed: {
          type: 'boolean',
          enum: [false],
          description: 'table is no longer in trash',
        },
        trashedAt: {
          type: 'string',
          nullable: true,
          description: 'Timestamp when moved to trash (now null)',
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
        'Not found - table with specified slug does not exist or is not in trash',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['table not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['table_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'table not found',
          code: 404,
          cause: 'table_NOT_FOUND',
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
          enum: ['REMOVE_table_FROM_TRASH_ERROR'],
        },
      },
    },
  },
};
