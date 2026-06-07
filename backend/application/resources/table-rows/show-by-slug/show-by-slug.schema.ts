export const TableRowShowBySlugSchema = {
  description: 'Buscar registro por slug amigável',
  tags: ['Registros'],
  params: {
    type: 'object',
    properties: {
      slug: {
        type: 'string',
        example: 'tarefas',
        description: 'Slug da tabela',
      },
      rowSlug: {
        type: 'string',
        example: 'nome-tarefa-xyz',
        description: 'Slug amigável do registro',
      },
    },
    required: ['slug', 'rowSlug'],
  },
  response: {
    200: {
      type: 'object',
      description: 'Registro encontrado',
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
          enum: ['TABLE_SLUG_FIELD_NOT_CONFIGURED', 'SLUG_FIELD_NOT_FOUND'],
        },
      },
    },
  },
};
