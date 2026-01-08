import type { FastifySchema } from 'fastify';

export const TablePaginatedSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'List tables paginated',
  description:
    'Get a paginated list of Tables with optional search and filtering',
  security: [{ cookieAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Page number (starts from 1)',
        examples: [1, 2, 5],
      },
      perPage: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Number of items per page (max 100)',
        examples: [10, 25, 50, 100],
      },
      search: {
        type: 'string',
        minLength: 1,
        description:
          'Search term for filtering Tables by name or slug (optional)',
        examples: ['user', 'product', 'blog'],
      },
      'order-name': {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Order by name (optional)',
        examples: ['asc', 'desc'],
      },
      'order-link': {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Order by link (optional)',
        examples: ['asc', 'desc'],
      },
      'order-created-at': {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Order by created at (optional)',
        examples: ['asc', 'desc'],
      },
      trashed: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'false',
        description: 'Include trashed items (optional)',
        examples: ['true', 'false'],
      },
      public: {
        type: 'string',
        enum: ['true', 'false'],
        default: 'false',
        description: 'Filter by public visibility (optional)',
        examples: ['true', 'false'],
      },
      type: {
        type: 'string',
        enum: ['TABLE', 'FIELD_GROUP'],
        description: 'Filter by table type (optional)',
        examples: ['TABLE', 'FIELD_GROUP'],
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
      description: 'Paginated list of Tables',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Table ID' },
              name: { type: 'string', description: 'Table name' },
              description: {
                type: 'string',
                nullable: true,
                description: 'Table description',
              },
              slug: {
                type: 'string',
                description: 'Table URL slug',
              },
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
                    enum: ['GALLERY', 'LIST'],
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
                        name: {
                          type: 'string',
                          description: 'User name',
                        },
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
                description: 'Generated MongoDB schema based on fields',
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
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              description: 'Total number of Tables',
            },
            perPage: {
              type: 'number',
              description: 'Number of items per page',
            },
            page: { type: 'number', description: 'Current page number' },
            lastPage: { type: 'number', description: 'Last page number' },
            firstPage: {
              type: 'number',
              description: 'First page number',
            },
          },
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
      examples: [
        {
          message: 'Unauthorized',
          code: 401,
          cause: 'AUTHENTICATION_REQUIRED',
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
          enum: ['TABLE_LIST_PAGINATED_ERROR'],
        },
      },
    },
  },
};
