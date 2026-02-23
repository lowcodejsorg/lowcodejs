import type { FastifySchema } from 'fastify';

const ForumMessageBodyProperties = {
  text: {
    type: 'string',
    description: 'Message HTML/text content',
  },
  attachments: {
    type: 'array',
    items: { type: 'string' },
    description: 'Attachment storage IDs',
  },
  mentions: {
    type: 'array',
    items: { type: 'string' },
    description: 'Mentioned user IDs',
  },
  replyTo: {
    type: ['string', 'null'],
    description: 'Replied message ID',
  },
} as const;

export const ForumMessageCreateSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Append forum message in channel row',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id'],
    properties: {
      slug: { type: 'string' },
      _id: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: ForumMessageBodyProperties,
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
    },
  },
};

export const ForumMessageUpdateSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Update own forum message in channel row',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id', 'messageId'],
    properties: {
      slug: { type: 'string' },
      _id: { type: 'string' },
      messageId: { type: 'string' },
    },
    additionalProperties: false,
  },
  body: {
    type: 'object',
    properties: ForumMessageBodyProperties,
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
    },
  },
};

export const ForumMessageDeleteSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Delete own forum message in channel row',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id', 'messageId'],
    properties: {
      slug: { type: 'string' },
      _id: { type: 'string' },
      messageId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
    },
  },
};

export const ForumMessageMentionReadSchema: FastifySchema = {
  tags: ['Rows'],
  summary: 'Mark forum mention as read',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['slug', '_id', 'messageId'],
    properties: {
      slug: { type: 'string' },
      _id: { type: 'string' },
      messageId: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
    },
  },
};
