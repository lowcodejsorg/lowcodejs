import type { FastifySchema } from 'fastify';

export const GroupFieldCreateSchema: FastifySchema = {
  tags: ['Group Fields'],
  summary: 'Create field in group',
  description:
    'Creates a new field inside a FIELD_GROUP. Automatically generates slug from name and rebuilds group and table schemas.',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', 'groupSlug'],
    properties: {
      slug: {
        type: 'string',
        description: 'Table slug',
      },
      groupSlug: {
        type: 'string',
        description: 'Group slug within the table',
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
        description: 'Field name',
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
          'CATEGORY',
          'USER',
        ],
        description: 'Field type',
      },
      required: { type: 'boolean', default: false },
      multiple: { type: 'boolean', default: false },
      showInFilter: { type: 'boolean', default: false },
      showInForm: { type: 'boolean', default: false },
      showInDetail: { type: 'boolean', default: false },
      showInList: { type: 'boolean', default: false },
      widthInForm: { type: 'number', nullable: true, default: 50 },
      widthInList: { type: 'number', nullable: true, default: 10 },
      widthInDetail: { type: 'number', nullable: true, default: 50 },
      locked: { type: 'boolean', default: false },
      format: { type: 'string', nullable: true, default: null },
      defaultValue: {
        anyOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'null' },
        ],
        default: null,
      },
      dropdown: { type: 'array', nullable: true, default: [] },
      relationship: { type: 'object', nullable: true, default: null },
      category: { type: 'array', nullable: true, default: [] },
    },
  },
  response: {
    201: {
      description: 'Field created successfully in group',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        type: { type: 'string' },
        required: { type: 'boolean' },
        multiple: { type: 'boolean' },
        showInFilter: { type: 'boolean' },
        showInForm: { type: 'boolean' },
        showInDetail: { type: 'boolean' },
        showInList: { type: 'boolean' },
        widthInForm: { type: 'number', nullable: true },
        widthInList: { type: 'number', nullable: true },
        widthInDetail: { type: 'number', nullable: true },
        locked: { type: 'boolean' },
        native: { type: 'boolean' },
        format: { type: 'string', nullable: true },
        defaultValue: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }, { type: 'null' }] },
        dropdown: {
          type: 'array',
          nullable: true,
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
          properties: {
            _id: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        trashed: { type: 'boolean' },
        trashedAt: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    403: {
      description: 'Forbidden - Group field is in trash',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [403] },
        cause: { type: 'string', enum: ['GROUP_IS_TRASHED'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    404: {
      description: 'Table or group not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['TABLE_NOT_FOUND', 'GROUP_NOT_FOUND'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    409: {
      description: 'Field already exists in group',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['FIELD_ALREADY_EXIST'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['CREATE_GROUP_FIELD_ERROR'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
