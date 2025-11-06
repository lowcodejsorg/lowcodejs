import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, POST } from 'fastify-decorators';

import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { Env } from '@start/env';

import { SignOutSchema } from './sign-out.schema';

@Controller({
  route: 'authentication',
})
export default class {
  @POST({
    url: '/sign-out',
    options: {
      onRequest: [AuthenticationMiddleware],
      schema: SignOutSchema,
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
