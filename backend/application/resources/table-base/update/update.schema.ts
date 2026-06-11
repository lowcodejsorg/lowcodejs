import { FastifySchema } from 'fastify';

export const TableUpdateSchema: FastifySchema = {
  tags: ['Tables'],
  summary: 'Atualizar tabela',
  description:
    'Atualiza uma tabela existente: nome, estilo, visibilidade, colaboração, administradores, ordenação de campos e layout. Renomear o slug propaga para a coleção dinâmica e campos de relacionamento.',
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
      fieldOrderFilter: {
        type: 'array',
        items: { type: 'string' },
        default: [],
      },
      fieldOrderDetail: {
        type: 'array',
        items: { type: 'string' },
        default: [],
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
              tip: {
                type: 'string',
                nullable: true,
                description: 'Optional help text shown in row forms',
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
                anyOf: [
                  { type: 'string' },
                  { type: 'array', items: { type: 'string' } },
                  { type: 'null' },
                ],
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
              allowCustomDropdownOptions: {
                type: 'boolean',
                description:
                  'Allow users to create new dropdown options from row input',
              },
              allowCreateRelationshipRecords: {
                type: 'boolean',
                description:
                  'Allow users to create records in the related table from row input',
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
        fieldOrderFilter: {
          type: 'array',
          items: { type: 'string' },
        },
        fieldOrderDetail: {
          type: 'array',
          items: { type: 'string' },
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
                    tip: { type: 'string', nullable: true },
                    locked: { type: 'boolean' },
                    native: { type: 'boolean' },
                    defaultValue: {
                      anyOf: [
                        { type: 'string' },
                        { type: 'array', items: { type: 'string' } },
                        { type: 'null' },
                      ],
                    },
                    relationship: {
                      type: 'object',
                      nullable: true,
                      additionalProperties: true,
                    },
                    dropdown: {
                      type: 'array',
                      nullable: true,
                      items: { type: 'object', additionalProperties: true },
                    },
                    allowCustomDropdownOptions: { type: 'boolean' },
                    allowCreateRelationshipRecords: { type: 'boolean' },
                    category: {
                      type: 'array',
                      nullable: true,
                      items: { type: 'object', additionalProperties: true },
                    },
                    group: {
                      type: 'object',
                      nullable: true,
                      additionalProperties: true,
                    },
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
        rowSlugFieldId: {
          type: 'string',
          nullable: true,
          description: 'Field ID used to generate friendly row slugs',
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
        'Requisição inválida - Parâmetros inválidos ou administradores inativos',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: ['INVALID_PARAMETERS', 'INACTIVE_ADMINISTRATORS'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    401: {
      description: 'Não autenticado - Autenticação necessária',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: {
          type: 'string',
          enum: ['AUTHENTICATION_REQUIRED', 'USER_NOT_AUTHENTICATED'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    403: {
      description: 'Acesso negado - Permissão insuficiente',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: {
          type: 'string',
          enum: [
            'USER_NOT_FOUND',
            'USER_NOT_ACTIVE',
            'PERMISSIONS_NOT_FOUND',
            'INSUFFICIENT_PERMISSIONS',
            'OWNER_OR_ADMIN_REQUIRED',
            'TABLE_PRIVATE',
          ],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    404: {
      description: 'Tabela não encontrada',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Tabela não encontrada'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    409: {
      description: 'Conflito - Já existe uma tabela com o slug gerado',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Tabela já existe'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['TABLE_ALREADY_EXISTS'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['UPDATE_TABLE_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
