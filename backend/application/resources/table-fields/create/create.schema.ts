import type { FastifySchema } from 'fastify';

export const TableFieldCreateSchema: FastifySchema = {
  tags: ['Campos'],
  summary: 'Criar campo',
  description:
    'Cria um novo campo em uma tabela. O título de exibição é armazenado em name, enquanto slug é a chave técnica segura. Se slug for omitido, a API o gera a partir de name. Para o tipo FIELD_GROUP, cria um novo grupo de campos.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Slug da tabela onde o campo será criado',
        examples: ['users', 'products', 'blog-posts'],
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
        description: 'Título de exibição do campo mostrado aos usuários finais',
        examples: [
          'Full Name',
          'Pesquise na base do USPTO e digite os resultados encontrados na busca de anterioridade (padrão). Você tem condições?',
        ],
      },
      slug: {
        type: 'string',
        minLength: 2,
        maxLength: 80,
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        description:
          'Chave técnica segura do campo. Use apenas letras minúsculas, números e hífens. Se omitido, a API sugere uma a partir de name.',
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
        ],
        description: 'Tipo do campo, conforme o enum FIELD_TYPE',
      },
      required: {
        type: 'boolean',
        default: false,
        description: 'Campo é obrigatório no preenchimento',
      },
      multiple: {
        type: 'boolean',
        default: false,
        description: 'Campo permite múltiplos valores',
      },
      showInFilter: {
        type: 'boolean',
        default: false,
        description: 'Permitir filtrar por este campo',
      },
      showInForm: {
        type: 'boolean',
        default: false,
        description: 'Exibir campo nos formulários de criação/edição',
      },
      showInDetail: {
        type: 'boolean',
        default: false,
        description: 'Exibir campo nas páginas de detalhe',
      },
      showInList: {
        type: 'boolean',
        default: false,
        description: 'Exibir campo nas visualizações de lista/grade/kanban',
      },
      widthInForm: {
        type: 'number',
        nullable: true,
        default: 50,
        description: 'Largura do campo em formulários, inteiro 0-100 (%)',
      },
      widthInList: {
        type: 'number',
        nullable: true,
        default: 10,
        description:
          'Largura do campo em visualizações de lista/grade, inteiro 0-100 (px)',
      },
      widthInDetail: {
        type: 'number',
        nullable: true,
        default: 50,
        description:
          'Largura do campo em visualizações de detalhe, inteiro 0-100 (%)',
      },
      tip: {
        type: 'string',
        nullable: true,
        default: null,
        description: 'Texto de ajuda opcional exibido nos formulários',
      },
      locked: {
        type: 'boolean',
        default: false,
        description: 'Campo está bloqueado e não pode ser modificado',
      },
      format: {
        type: 'string',
        nullable: true,
        default: null,
        description:
          'Formato do campo (para TEXT_SHORT: ALPHA_NUMERIC, INTEGER, DECIMAL, URL, EMAIL; para DATE: diversos formatos de data)',
        examples: ['EMAIL', 'dd/MM/yyyy', 'DECIMAL'],
      },
      defaultValue: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'null' },
        ],
        default: null,
        description: 'Valor padrão do campo',
      },
      dropdown: {
        type: 'array',
        nullable: true,
        default: [],
        description: 'Opções para campos do tipo DROPDOWN',
        items: {
          type: 'object',
          required: ['id', 'label'],
          properties: {
            id: { type: 'string', description: 'ID da opção de seleção' },
            label: { type: 'string', description: 'Rótulo da opção de seleção' },
            color: { type: 'string', description: 'Cor da opção de seleção' },
          },
        },
      },
      allowCustomDropdownOptions: {
        type: 'boolean',
        default: false,
        description:
          'Permitir que usuários criem novas opções de seleção a partir do formulário',
      },
      allowCreateRelationshipRecords: {
        type: 'boolean',
        default: false,
        description:
          'Permitir que usuários criem registros na tabela relacionada a partir do formulário',
      },
      relationship: {
        type: 'object',
        nullable: true,
        default: null,
        description: 'Configuração para o tipo RELATIONSHIP',
        properties: {
          table: {
            type: 'object',
            required: ['_id', 'slug'],
            properties: {
              _id: {
                type: 'string',
                description: 'ID da tabela de destino',
              },
              slug: {
                type: 'string',
                description: 'Slug da tabela de destino',
              },
            },
          },
          field: {
            type: 'object',
            required: ['_id', 'slug'],
            properties: {
              _id: { type: 'string', description: 'ID do campo de destino' },
              slug: {
                type: 'string',
                description: 'Slug do campo de destino',
              },
            },
          },
          order: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            description: 'Ordem de classificação dos dados do relacionamento',
          },
          customLabel: {
            type: 'boolean',
            default: false,
            description:
              'Habilitar rótulo composto/personalizado para as opções de seleção',
          },
          labelParts: {
            type: 'array',
            description:
              'Caminhos (dot-paths) ordenados que compõem o rótulo personalizado',
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
            description: 'Separador entre as partes do rótulo',
          },
        },
      },
      group: {
        anyOf: [
          { type: 'null' },
          { type: 'string', description: 'Slug do grupo' },
          {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                description: 'ID da tabela do grupo de campos',
              },
              slug: {
                type: 'string',
                description: 'Slug da tabela do grupo de campos',
              },
            },
          },
        ],
        default: null,
        description:
          'Configuração para o tipo FIELD_GROUP (slug ou objeto)',
      },
      category: {
        type: 'array',
        nullable: true,
        default: [],
        description: 'Categorias para o tipo CATEGORY',
        items: {
          type: 'object',
          required: ['id', 'label'],
          properties: {
            id: { type: 'string', description: 'ID da categoria' },
            label: { type: 'string', description: 'Rótulo da categoria' },
            children: {
              type: 'array',
              description: 'Categorias aninhadas',
            },
          },
        },
      },
    },
  },
  response: {
    201: {
      description:
        'Field created successfully with generated slug and updated table schema',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Field ID' },
        name: { type: 'string', description: 'Field name' },
        slug: { type: 'string', description: 'Generated field slug' },
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
        trashed: {
          type: 'boolean',
          enum: [false],
          description: 'Field is not trashed',
        },
        trashedAt: {
          type: 'string',
          nullable: true,
          description: 'When field was trashed (null for new fields)',
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
      description: 'Acesso negado - Permissões insuficientes',
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
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    409: {
      description:
        'Conflito - Campo já existe ou opções de dropdown duplicadas',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [409] },
        cause: {
          type: 'string',
          enum: ['FIELD_ALREADY_EXIST', 'DROPDOWN_OPTION_ALREADY_EXISTS'],
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
        cause: { type: 'string', enum: ['CREATE_FIELD_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
