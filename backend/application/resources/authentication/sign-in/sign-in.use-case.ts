/* eslint-disable no-unused-vars */
import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import {
  E_USER_STATUS,
  type IUser as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

import type { SignInBodyValidator } from './sign-in.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof SignInBodyValidator>;

@Service()
export default class SignInUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        email: payload.email,
        exact: true,
      });

      if (!user)
        return left(
          HTTPException.Unauthorized(
            'Credenciais invalidas',
            'INVALID_CREDENTIALS',
          ),
        );

      if (user.status === E_USER_STATUS.INACTIVE)
        return left(
          HTTPException.Unauthorized('Usuario inativo', 'USER_INACTIVE'),
        );

      const passwordDoesMatch = await bcrypt.compare(
        payload.password,
        user.password,
      );

      if (!passwordDoesMatch)
        return left(HTTPException.Unauthorized('Credenciais invalidas'));

      return right(user);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SIGN_IN_ERROR',
        ),
      );
    }
  }
}
