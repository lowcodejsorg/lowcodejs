/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IRow } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { filterRowFieldsByVisibility } from '@application/core/field-visibility-filter.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { GroupResolutionContractService } from '@application/services/group-resolution/group-resolution-contract.service';
import { RowContextContractService } from '@application/services/row-context/row-context-contract.service';
import { RowPasswordContractService } from '@application/services/row-password/row-password-contract.service';

import type { TableRowShowPayload } from './show.validator';

type Response = Either<HTTPException, IRow>;

type Payload = TableRowShowPayload & { user?: string };

@Service()
export default class TableRowShowUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
    private readonly rowPasswordService: RowPasswordContractService,
    private readonly rowContextService: RowContextContractService,
    private readonly userRepository: UserContractRepository,
    private readonly groupResolutionService: GroupResolutionContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      const row = await this.rowRepository.findOne({
        table,
        query: { _id: payload._id },
        includeReverseRelationships: true,
      });

      if (!row) {
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );
      }

      this.rowPasswordService.mask(row, table.fields);

      const transformed = this.rowContextService.transform(
        row,
        table.fields,
        payload.user,
      );

      const effectiveGroupIds = await this.resolveEffectiveGroupIds(
        payload.user,
      );

      return right(
        filterRowFieldsByVisibility(
          transformed,
          table.fields,
          effectiveGroupIds,
          'detail',
        ),
      );
    } catch (error) {
      console.error('[table-rows > show][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'GET_ROW_TABLE_BY_ID_ERROR',
        ),
      );
    }
  }

  private async resolveEffectiveGroupIds(
    userId: string | undefined,
  ): Promise<Set<string>> {
    if (!userId) return new Set<string>();
    const user = await this.userRepository.findById(userId);
    if (!user) return new Set<string>();
    return new Set(this.groupResolutionService.resolveUserGroupIds(user));
  }
}
