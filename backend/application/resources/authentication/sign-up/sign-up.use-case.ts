/* eslint-disable no-unused-vars */
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import {
  E_ROLE,
  E_USER_STATUS,
  type IUser as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { SignUpBodyValidator } from './sign-up.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof SignUpBodyValidator>;

@Service()
export default class SignUpUseCase {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

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

      const group = await this.userGroupRepository.findBy({
        slug: E_ROLE.REGISTERED,
        exact: true,
      });

      if (!group)
        return left(
          HTTPException.Conflict('Group not found', 'GROUP_NOT_FOUND'),
        );

      const passwordHash = await hash(payload.password, 6);

      const created = await this.userRepository.create({
        ...payload,
        password: passwordHash,
        group: group._id,
        status: E_USER_STATUS.ACTIVE,
      });

      return right(created);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SIGN_UP_ERROR',
        ),
      );
    }
  }
}
