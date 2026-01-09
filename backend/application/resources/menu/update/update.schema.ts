import type { FastifySchema } from 'fastify';

export const MenuUpdateSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Update a menu item',
  description: 'Updates an existing menu item with optional new values',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Menu item ID',
      },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Menu item name',
      },
      type: {
        type: 'string',
        enum: ['TABLE', 'PAGE', 'FORM', 'EXTERNAL', 'SEPARATOR'],
        description: 'Menu item type',
      },
      parent: {
        type: 'string',
        description: 'Parent menu item ID',
        nullable: true,
      },
      table: {
        type: 'string',
        description: 'Table ID (required for table/form types)',
        nullable: true,
      },
      pageContent: {
        type: 'string',
        description: 'HTML content (for page type)',
        nullable: true,
      },
      url: {
        type: 'string',
        description: 'External URL (for external type)',
        nullable: true,
      },
    },
  },
  response: {
    200: {
      description: 'Menu item updated successfully',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Menu ID' },
        name: { type: 'string', description: 'Menu name' },
        slug: { type: 'string', description: 'Menu slug' },
        type: { type: 'string', description: 'Menu type' },
        parent: { type: 'string', nullable: true, description: 'Parent ID' },
        table: { type: 'string', nullable: true, description: 'Table ID' },
        pageContent: {
          type: 'string',
          nullable: true,
          description: 'Page content',
        },
        url: { type: 'string', nullable: true, description: 'URL' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    400: {
      description: 'Bad request - Validation failed',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [400] },
        cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
      },
    },
    404: {
      description: 'Menu item not found',
      type: 'object',
      properties: {
        message: {
          type: 'string',
          enum: ['Menu not found', 'Table not found', 'Parent menu not found'],
        },
        code: { type: 'number', enum: [404] },
        cause: {
          type: 'string',
          enum: ['MENU_NOT_FOUND', 'TABLE_NOT_FOUND', 'PARENT_MENU_NOT_FOUND'],
        },
      },
    },
    409: {
      description: 'Conflict - Menu with this name already exists',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Menu already exists'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['MENU_ALREADY_EXISTS'] },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['UPDATE_MENU_ERROR'] },
      },
    },
  },
};
