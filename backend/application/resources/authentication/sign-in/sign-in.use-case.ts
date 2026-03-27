/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import {
  E_USER_STATUS,
  type IUser as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { PasswordContractService } from '@application/services/password/password-contract.service';

import type { SignInBodyValidator } from './sign-in.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof SignInBodyValidator>;

@Service()
export default class SignInUseCase {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly passwordService: PasswordContractService,
  ) {}

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
          HTTPException.Unauthorized('Usuário inativo', 'USER_INACTIVE'),
        );

      const passwordDoesMatch = await this.passwordService.compare(
        payload.password,
        user.password,
      );

      if (!passwordDoesMatch)
        return left(
          HTTPException.Unauthorized(
            'Credenciais invalidas',
            'INVALID_CREDENTIALS',
          ),
        );

      return right(user);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SIGN_IN_ERROR',
        ),
      );
    }
  }
}
