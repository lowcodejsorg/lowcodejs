/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import { left, right, type Either } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { PasswordContractService } from '@application/services/password/password-contract.service';

import type { ResetPasswordPayload } from './reset-password.validator';

type Response = Either<HTTPException, null>;
type Payload = ResetPasswordPayload;

@Service()
export default class UpdatePasswordRecoveryUseCase {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly passwordService: PasswordContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      const hashedPassword = await this.passwordService.hash(payload.password);

      await this.userRepository.update({
        _id: user._id,
        password: hashedPassword,
      });

      return right(null);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_PASSWORD_ERROR',
        ),
      );
    }
  }
}
