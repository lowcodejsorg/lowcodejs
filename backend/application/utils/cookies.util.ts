import type { FastifyReply } from 'fastify';

import { Env } from '@start/env';

import type { TokenPair } from './jwt.util';

export const setCookieTokens = (
  response: FastifyReply,
  tokens: TokenPair,
): void => {
  const cookieOptions = {
    path: '/',
    secure: Env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true,
  };

  response
    .setCookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 1000, // 24h
    })
    .setCookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 7 * 24 * 1000, // 7d
    });
};
