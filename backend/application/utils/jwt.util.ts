import type { FastifyReply } from 'fastify';

import type { E_ROLE, IJWTPayload, IUser } from '@application/core/entity.core';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const createTokens = async (
  user: Pick<IUser, '_id' | 'email' | 'group'>,
  response: FastifyReply,
): Promise<TokenPair> => {
  const jwt: IJWTPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user?.group?.slug?.toUpperCase() as keyof typeof E_ROLE,
    type: 'access',
  };

  const accessToken = await response.jwtSign(jwt, {
    sub: user._id.toString(),
    expiresIn: '24h',
  });

  const refreshToken = await response.jwtSign(
    {
      sub: user._id.toString(),
      type: 'refresh',
    },
    {
      sub: user._id.toString(),
      expiresIn: '7d',
    },
  );

  return { accessToken, refreshToken };
};
