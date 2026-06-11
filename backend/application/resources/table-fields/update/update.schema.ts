import type { FastifySchema } from 'fastify';

export const TableFieldUpdateSchema: FastifySchema = {
  tags: ['Fields'],
  summary: 'Update field',
  description:
    'Updates an existing field in a table. Changing name only changes the display title. Slug is the safe technical key and only changes when explicitly sent.',
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
        minLength: 1,
        maxLength: 500,
        description: 'Field display title shown to end users',
        examples: [
          'Full Name Updated',
          'Pesquise na base do USPTO e digite os resultados encontrados na busca de anterioridade (padrão). Você tem condições?',
        ],
      },
      slug: {
        type: 'string',
        minLength: 2,
        maxLength: 80,
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        description:
          'Safe technical field key. Changing it renames the stored field data.',
        examples: ['full-name', 'nome-slug-campo'],
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
          'STATUS',
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
      widthInDetail: {
        type: 'number',
        nullable: true,
        default: 50,
        description: 'Field width in detail views, integer 0-100 (%)',
      },
      tip: {
        type: 'string',
        nullable: true,
        default: null,
        description: 'Optional help text shown in row forms',
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
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'null' },
        ],
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
            sortField: { type: 'string', nullable: true },
            sortDirection: {
              type: 'string',
              enum: ['asc', 'desc', null],
              nullable: true,
            },
          },
        },
      },
      allowCustomDropdownOptions: {
        type: 'boolean',
        default: false,
        description:
          'Allow users to create new dropdown options from row input',
      },
      allowCreateRelationshipRecords: {
        type: 'boolean',
        default: false,
        description:
          'Allow users to create records in the related table from row input',
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
          customLabel: {
            type: 'boolean',
            default: false,
            description: 'Enable composite/custom label for select options',
          },
          labelParts: {
            type: 'array',
            description: 'Ordered dot-paths composing the custom label',
            items: {
              type: 'object',
              required: ['path'],
              properties: {
                path: { type: 'string' },
                label: { type: 'string' },
              },
            },
          },
          labelSeparator: {
            type: 'string',
            default: ' - ',
            description: 'Separator between label parts',
          },
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
            'STATUS',
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
        locked: { type: 'boolean', description: 'Field is locked' },
        native: { type: 'boolean', description: 'Field is native' },
        format: {
          type: 'string',
          nullable: true,
          description: 'Field format',
        },
        defaultValue: {
          anyOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
            { type: 'null' },
          ],
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
              sortField: { type: 'string', nullable: true },
              sortDirection: {
                type: 'string',
                enum: ['asc', 'desc', null],
                nullable: true,
              },
            },
          },
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
            customLabel: { type: 'boolean' },
            labelParts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  label: { type: 'string' },
                },
              },
            },
            labelSeparator: { type: 'string' },
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
      description:
        'Requisição inválida - Falha na validação do payload ou slug/tabela inválidos',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [400] },
        cause: {
          type: 'string',
          enum: [
            'INVALID_PAYLOAD_FORMAT',
            'INVALID_PARAMETERS',
            'INVALID_TABLE_SLUG',
            'INVALID_FIELD_SLUG',
          ],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    401: {
      description: 'Não autorizado - Autenticação necessária',
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
      description:
        'Acesso negado - Permissões insuficientes ou campo protegido',
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
            'NATIVE_FIELD_CANNOT_BE_TRASHED',
            'FIELD_LOCKED',
          ],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    404: {
      description: 'Tabela ou campo não encontrado',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'FIELD_NOT_FOUND'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    409: {
      description:
        'Conflito - Último campo ativo, campo já existe ou opções de dropdown duplicadas',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [409] },
        cause: {
          type: 'string',
          enum: [
            'LAST_ACTIVE_FIELD',
            'FIELD_ALREADY_EXIST',
            'DROPDOWN_OPTION_ALREADY_EXISTS',
          ],
        },
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
        cause: {
          type: 'string',
          enum: ['UPDATE_FIELD_TABLE_ERROR'],
        },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
