const ConfigResponse = {
  type: 'object',
  additionalProperties: true,
};

const ErrorResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: ['string', 'number'] },
    cause: { type: 'string' },
    errors: { type: 'object', additionalProperties: true },
  },
};

export const CascadeDropdownGetConfigSchema = {
  description: 'Busca configuração do dropdown em cascata para um campo.',
  tags: ['Cascade Dropdown'],
  response: {
    200: ConfigResponse,
    404: ErrorResponse,
  },
};

export const CascadeDropdownSaveConfigSchema = {
  description: 'Salva configuração do dropdown em cascata para um campo.',
  tags: ['Cascade Dropdown'],
  body: {
    type: 'object',
    required: [
      'sourceTableId',
      'sourceTableSlug',
      'parentFieldId',
      'parentFieldSlug',
      'childFieldId',
      'childFieldSlug',
    ],
    properties: {
      sourceTableId: { type: 'string' },
      sourceTableSlug: { type: 'string' },
      parentFieldId: { type: 'string' },
      parentFieldSlug: { type: 'string' },
      childFieldId: { type: 'string' },
      childFieldSlug: { type: 'string' },
      enabled: { type: 'boolean' },
      parentWidth: { type: 'number' },
      childWidth: { type: 'number' },
      filters: { type: 'array', items: { type: 'object' } },
    },
  },
  response: {
    200: ConfigResponse,
    400: ErrorResponse,
    404: ErrorResponse,
  },
};

export const CascadeDropdownParentOptionsSchema = {
  description: 'Lista opções do campo controlador do dropdown em cascata.',
  tags: ['Cascade Dropdown'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' },
        },
      },
    },
    404: ErrorResponse,
  },
};

export const CascadeDropdownChildOptionsSchema = {
  description: 'Lista opções do campo dependente do dropdown em cascata.',
  tags: ['Cascade Dropdown'],
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            perPage: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
            firstPage: { type: 'number' },
          },
        },
      },
    },
    404: ErrorResponse,
  },
};
