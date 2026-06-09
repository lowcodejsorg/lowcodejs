export const TableRowShowBySlugSchema = {
  description:
    'Resolve um registro pelo slug amigável (sharedRowSlug) e retorna o JSON do registro. A navegação (abrir /tables/:slug/row?_id=...) fica a cargo do frontend.',
  tags: ['Registros'],
  params: {
    type: 'object',
    properties: {
      slug: {
        type: 'string',
        description: 'Slug da tabela (ex: tarefas)',
      },
      rowSlug: {
        type: 'string',
        description: 'Slug amigável do registro (ex: nome-tarefa-xyz)',
      },
    },
    required: ['slug', 'rowSlug'],
  },
  response: {
    200: {
      type: 'object',
      description: 'Registro encontrado',
      properties: {
        _id: { type: 'string', description: 'ID do registro' },
        sharedRowSlug: { type: 'string', nullable: true },
      },
      // Row é dinâmico — sem isto o fast-json-stringify descarta todos os campos.
      additionalProperties: true,
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: {
          type: 'string',
          enum: ['TABLE_NOT_FOUND', 'ROW_NOT_FOUND'],
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number' },
        cause: {
          type: 'string',
          enum: ['TABLE_SLUG_FIELD_NOT_CONFIGURED'],
        },
      },
    },
  },
};
