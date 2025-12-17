import type { FastifySchema } from 'fastify';

export const MenuDeleteSchema: FastifySchema = {
  tags: ['Menu'],
  summary: 'Delete menu by ID (soft delete)',
  description:
    'Moves a menu item to trash. Prevents deletion of separators with active children.',
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
      description: 'Menu successfully moved to trash',
      type: 'null',
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
    409: {
      description: 'Separator has active children',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Separator has active children'] },
        code: { type: 'number', enum: [409] },
        cause: { type: 'string', enum: ['SEPARATOR_HAS_CHILDREN'] },
        data: {
          type: 'object',
          properties: {
            childrenCount: { type: 'number' },
            children: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal server error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['DELETE_MENU_ERROR'] },
      },
    },
  },
};
