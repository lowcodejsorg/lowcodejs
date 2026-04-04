/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_USER_STATUS,
  type IUser as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { PasswordContractService } from '@application/services/password/password-contract.service';

import type { UserCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserCreatePayload;

@Service()
export default class UserCreateUseCase {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly passwordService: PasswordContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload.group)
        return left(
          HTTPException.BadRequest(
            'Grupo não informado',
            'GROUP_NOT_INFORMED',
            { group: 'Grupo não informado' },
          ),
        );

      const user = await this.userRepository.findByEmail(payload.email);

      if (user)
        return left(
          HTTPException.Conflict('Usuário já existe', 'USER_ALREADY_EXISTS', {
            email: 'Usuário já existe',
          }),
        );

      const passwordHash = await this.passwordService.hash(payload.password);

      const created = await this.userRepository.create({
        ...payload,
        password: passwordHash,
        status: E_USER_STATUS.ACTIVE,
      });

      return right(created);
    } catch (error) {
      console.error('[users > create][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_USER_ERROR',
        ),
      );
    }
  }
}
