/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IGroup as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserGroupUpdatePayload;

@Service()
export default class UserGroupUpdateUseCase {
  constructor(
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const group = await this.userGroupRepository.findById(payload._id);

      if (!group) {
        return left(
          HTTPException.NotFound(
            'Grupo de usuários não encontrado',
            'USER_GROUP_NOT_FOUND',
          ),
        );
      }

      if (group.immutable) {
        return left(
          HTTPException.Forbidden(
            'Este grupo é imutável e não pode ser editado',
            'GROUP_IMMUTABLE',
          ),
        );
      }

      if (payload.permissions && payload.permissions.length === 0) {
        return left(
          HTTPException.BadRequest(
            'Ao menos uma permissão deve ser informada para o grupo de usuários',
            undefined,
            {
              permissions:
                'Ao menos uma permissão deve ser informada para o grupo de usuários',
            },
          ),
        );
      }

      if (payload.encompasses && payload.encompasses.length > 0) {
        const hasCycle = await this.detectCycle(
          payload._id,
          payload.encompasses,
        );

        if (hasCycle) {
          return left(
            HTTPException.BadRequest(
              'Referência circular detectada na cadeia de grupos englobados',
              'ENCOMPASSES_CYCLE_DETECTED',
              {
                encompasses:
                  'Referência circular detectada na cadeia de grupos englobados',
              },
            ),
          );
        }
      }

      const updated = await this.userGroupRepository.update(payload);

      return right(updated);
    } catch (error) {
      console.error('[user-groups > update][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_USER_GROUP_ERROR',
        ),
      );
    }
  }

  private async detectCycle(
    currentGroupId: string,
    newEncompasses: string[],
  ): Promise<boolean> {
    const visited = new Set<string>();
    visited.add(currentGroupId);

    const queue = [...newEncompasses];

    while (queue.length > 0) {
      const groupId = queue.shift();
      if (!groupId) continue;

      if (visited.has(groupId)) {
        return true;
      }

      visited.add(groupId);

      const group = await this.userGroupRepository.findById(groupId);

      if (group?.encompasses) {
        for (const encompassed of group.encompasses) {
          const id = encompassed._id?.toString();
          if (id) {
            queue.push(id);
          }
        }
      }
    }

    return false;
  }
}
