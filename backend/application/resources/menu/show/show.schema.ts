import type { FastifySchema } from 'fastify';

export const MenuShowSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Get menu by ID',
  description: 'Retrieves a specific menu item by its ID',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['_id'],
    properties: {
      _id: {
        type: 'string',
        description: 'Menu ID',
      },
    },
  },
  response: {
    200: {
      description: 'Menu details',
      type: 'object',
      properties: {
        _id: { type: 'string', description: 'Menu ID' },
        name: { type: 'string', description: 'Menu name' },
        slug: { type: 'string', description: 'Menu slug' },
        type: { type: 'string', description: 'Menu type' },
        parent: {
          type: 'object',
          nullable: true,
          description: 'Parent menu',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
          },
        },
        table: {
          type: 'object',
          nullable: true,
          description: 'Associated table',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        html: {
          type: 'string',
          nullable: true,
          description: 'Page content',
        },
        url: { type: 'string', nullable: true, description: 'URL' },
        children: {
          type: 'array',
          description: 'Active child menu items',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Child menu ID' },
              name: { type: 'string', description: 'Child menu name' },
              type: { type: 'string', description: 'Child menu type' },
              slug: { type: 'string', description: 'Child menu slug' },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
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
      description: 'Menu not found',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Menu not found'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['MENU_NOT_FOUND'] },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['GET_MENU_BY_ID_ERROR'] },
      },
    },
  },
};
