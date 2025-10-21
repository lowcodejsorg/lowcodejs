import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@middlewares/authentication.middleware';
import { Env } from '@start/env';

@Controller({
  route: 'authentication',
})
export default class {
  @POST({
    url: '/sign-out',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: {
        tags: ['Authentication'],
        summary: 'User sign out',
        description:
          'Signs out the current user by clearing authentication cookies. Requires valid access token.',
        security: [{ cookieAuth: [] }],
        response: {
          200: {
            description: 'Successfully signed out',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Successfully signed out'] },
            },
          },
          401: {
            description: 'Unauthorized - Invalid or missing access token',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Authentication required'] },
              code: { type: 'number', enum: [401] },
              cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
            },
            examples: [
              {
                message: 'Authentication required',
                code: 401,
                cause: 'AUTHENTICATION_REQUIRED',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const cookieOptions = {
      path: '/',
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      httpOnly: true,
    };

    response
      .setCookie('accessToken', '', {
        ...cookieOptions,
        maxAge: 0,
      })
      .setCookie('refreshToken', '', {
        ...cookieOptions,
        maxAge: 0,
      });

    return response.status(200).send({ message: 'Successfully signed out' });
  }
}
