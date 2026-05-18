const errorBlock = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'number' },
    cause: { type: 'string' },
    errors: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const responseFieldSchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    label: { type: 'string' },
    type: { type: 'string', enum: ['string', 'date', 'number', 'boolean'] },
  },
};

const documentTypeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    responseFields: { type: 'array', items: responseFieldSchema },
  },
};

const configResponseSchema = {
  type: 'object',
  properties: {
    apiUrl: { type: 'string', nullable: true },
    apiKey: { type: 'string', nullable: true },
    model: { type: 'string', nullable: true },
    documentTypes: { type: 'array', items: documentTypeSchema },
  },
};

export const GetConfigSchema = {
  response: {
    200: configResponseSchema,
    400: errorBlock,
    401: errorBlock,
    404: errorBlock,
  },
};

export const UpdateConfigSchema = {
  body: {
    type: 'object',
    properties: {
      apiUrl: { type: 'string', nullable: true },
      apiKey: { type: 'string', nullable: true },
      model: { type: 'string', nullable: true },
      documentTypes: { type: 'array', items: documentTypeSchema },
    },
  },
  response: {
    200: configResponseSchema,
    400: errorBlock,
    401: errorBlock,
    403: errorBlock,
    404: errorBlock,
  },
};

export const TranscribeSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        documentTypeId: { type: 'string' },
        documentTypeName: { type: 'string' },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              label: { type: 'string' },
              type: { type: 'string' },
              value: {},
            },
          },
        },
        raw: {},
      },
    },
    400: errorBlock,
    401: errorBlock,
    404: errorBlock,
    502: errorBlock,
  },
};
