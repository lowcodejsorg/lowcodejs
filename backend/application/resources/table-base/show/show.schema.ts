import type { FastifySchema } from 'fastify';

export const TableShowSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Get table by slug',
  description:
    'Retrieves a table by its slug with populated fields and administrators. Supports public visibility filtering.',
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
  querystring: {
    type: 'object',
    properties: {
      trashed: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'false',
        description: 'Include trashed tables (optional)',
        examples: ['true', 'false'],
      },
      public: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'false',
        description: 'Filter by public visibility only (optional)',
        examples: ['true', 'false'],
      },
      type: {
        type: 'string',
        enum: ['TABLE', 'FIELD_GROUP'],
        description: 'Filter by table type (optional)',
        examples: ['table', 'field-group'],
      },
      name: {
        type: 'string',
        description: 'Filter by exact table name (optional)',
        examples: ['Users', 'Products'],
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Table retrieved successfully with populated data',
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
          },
        },
        fields: {
          type: 'array',
          description: 'Table fields (populated)',
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
      description:
        'Bad request - Table is not public when requesting public access',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Table is not public'] },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['TABLE_NOT_PUBLIC'] },
      },
      examples: [
        {
          message: 'Table is not public',
          code: 400,
          cause: 'TABLE_NOT_PUBLIC',
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
        cause: { type: 'string', enum: ['GET_TABLE_BY_SLUG_ERROR'] },
      },
    },
  },
};
