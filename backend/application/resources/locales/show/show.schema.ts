import type { FastifySchema } from 'fastify';

export const LocaleShowSchema: FastifySchema = {
  tags: ['Traduções'],
  summary: 'Buscar traduções por locale',
  description:
    'Retorna todas as traduções do sistema para um locale específico a partir dos arquivos de propriedades',
  params: {
    type: 'object',
    required: ['locale'],
    properties: {
      locale: {
        type: 'string',
        description: 'Identificador do locale (formato idioma-país)',
        examples: ['pt-br', 'en-us'],
        pattern: '^[a-z]{2}-[a-z]{2}$',
        errorMessage: {
          type: 'O locale deve ser um texto',
          pattern: 'O locale deve estar no formato idioma-país (ex: pt-br)',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        locale: 'O locale é obrigatório',
      },
      additionalProperties: 'Campos extras não são permitidos',
    },
  },
  response: {
    200: {
      description: 'Traduções recuperadas com sucesso',
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string', description: 'Valor de tradução único' },
          {
            type: 'array',
            items: { type: 'string' },
            description: 'Array de valores de tradução (separados por vírgula)',
          },
        ],
      },
      examples: [
        {
          SIDEBAR_MENU_HOME_LABEL: 'Início',
          USER_ROUTE_TABLE_HEADERS: ['Nome', 'E-mail', 'Função', 'Status'],
          FIELD_TYPE_TEXT_SHORT_LABEL: 'Texto Curto',
        },
      ],
    },
    404: {
      description: 'Locale não encontrado',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Locale não encontrado'] },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['LOCALE_NOT_FOUND'] },
      },
      examples: [
        {
          message: 'Locale não encontrado',
          code: 404,
          cause: 'LOCALE_NOT_FOUND',
        },
      ],
    },
    500: {
      description: 'Erro interno do servidor',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Erro interno do servidor'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['LOCALE_READ_ERROR'] },
      },
    },
  },
};
