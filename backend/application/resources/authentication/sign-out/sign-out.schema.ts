import type { FastifySchema } from 'fastify';

export const SignOutSchema: FastifySchema = {
  tags: ['Autenticação'],
  summary: 'Logout do usuário',
  description:
    'Realiza o logout do usuário autenticado limpando os cookies de autenticação (efeito colateral). Requer access token válido',
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      description: 'Logout realizado com sucesso - limpa os cookies httpOnly',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    401: {
      description: 'Não autorizado - Autenticação necessária',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
        errors: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};
