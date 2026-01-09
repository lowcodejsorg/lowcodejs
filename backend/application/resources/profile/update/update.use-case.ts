/* eslint-disable no-unused-vars */
import { hash } from 'bcryptjs';
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { isPasswordMatch } from '@config/util.config';

import type { ProfileUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = ProfileUpdatePayload;

@Service()
export default class ProfileUpdateUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload?.group)
        return left(
          HTTPException.BadRequest('Group not informed', 'GROUP_NOT_INFORMED'),
        );

      const user = await this.userRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!user)
        return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));

      if (!payload.allowPasswordChange) {
        const updated = await this.userRepository.update({
          _id: user._id,
          name: payload.name,
          email: payload.email,
          group: payload.group,
        });

        return right(updated);
      }

      const isMatch = await isPasswordMatch({
        hashed: user.password,
        plain: payload.currentPassword as string,
      });

      if (!isMatch)
        return left(
          HTTPException.Unauthorized(
            'Invalid credentials',
            'INVALID_CREDENTIALS',
          ),
        );

      const password = await hash(payload.newPassword as string, 6);

      const updated = await this.userRepository.update({
        _id: user._id,
        name: payload.name,
        email: payload.email,
        group: payload.group,
        password,
      });

      return right(updated);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_USER_PROFILE_ERROR',
        ),
      );
    }
  }
}
