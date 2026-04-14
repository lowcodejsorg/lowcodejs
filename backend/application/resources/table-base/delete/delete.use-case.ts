/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { GroupResolutionContractService } from '@application/services/group-resolution/group-resolution-contract.service';

import type { TableDeletePayload } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = TableDeletePayload & { _currentUserId?: string };

@Service()
export default class TableDeleteUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly groupResolutionService: GroupResolutionContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload._currentUserId) {
        return left(
          HTTPException.Unauthorized(
            'Usuário não autenticado',
            'USER_NOT_AUTHENTICATED',
          ),
        );
      }

      const currentUser = await this.userRepository.findById(
        payload._currentUserId,
      );

      if (!currentUser || !this.groupResolutionService.isMasterUser(currentUser)) {
        return left(
          HTTPException.Forbidden(
            'Apenas o grupo MASTER pode excluir tabelas permanentemente',
            'MASTER_ONLY',
          ),
        );
      }

      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      // Excluir campos associados à tabela
      const fieldIds = table.fields?.map((f) => f._id) ?? [];
      if (fieldIds.length > 0) {
        await this.fieldRepository.deleteMany(fieldIds);
      }

      // Dropar a coleção dinâmica (registros da tabela)
      await this.tableRepository.dropCollection(table.slug);

      // Excluir o documento da tabela
      await this.tableRepository.delete(table._id);

      return right(null);
    } catch (error) {
      console.error('[table-base > delete][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'DELETE_TABLE_ERROR',
        ),
      );
    }
  }
}
