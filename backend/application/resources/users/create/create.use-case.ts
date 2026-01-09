/* eslint-disable no-unused-vars */
import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_USER_STATUS,
  type IUser as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

import type { UserCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserCreatePayload;

@Service()
export default class UserCreateUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        email: payload.email,
        exact: true,
      });

      if (user)
        return left(
          HTTPException.Conflict('User already exists', 'USER_ALREADY_EXISTS'),
        );

      const passwordHash = await bcrypt.hash(payload.password, 12);

      const created = await this.userRepository.create({
        ...payload,
        password: passwordHash,
        status: E_USER_STATUS.ACTIVE,
      });

      return right(created);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_USER_ERROR',
        ),
      );
    }
  }
}
