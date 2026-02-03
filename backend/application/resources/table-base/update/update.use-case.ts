/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  E_TABLE_TYPE,
  E_USER_STATUS,
  type ITable as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

import type { TableUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableUpdatePayload;

@Service()
export default class TableUpdateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      // Validar que apenas usuários ativos podem ser administradores
      if (payload.administrators && payload.administrators.length > 0) {
        const adminIds = payload.administrators;
        const activeAdmins = await this.userRepository.findMany({
          _ids: adminIds,
          status: E_USER_STATUS.ACTIVE,
          trashed: false,
        });

        if (activeAdmins.length !== adminIds.length) {
          return left(
            HTTPException.BadRequest(
              'All administrators must be active users',
              'INACTIVE_ADMINISTRATORS',
            ),
          );
        }
      }

      // Mapear propriedades populadas para strings (IDs)
      const updated = await this.tableRepository.update({
        _id: table._id,
        ...payload,
        owner: table.owner._id,
        style: payload.style ?? table.style,
        visibility: payload.visibility ?? table.visibility,
        collaboration: payload.collaboration ?? table.collaboration,
        fieldOrderList: payload.fieldOrderList ?? table.fieldOrderList,
        fieldOrderForm: payload.fieldOrderForm ?? table.fieldOrderForm,
        administrators:
          payload.administrators ?? table.administrators.flatMap((a) => a._id),
      });

      // Propagar visibilidade para grupos de campos (FIELD_GROUP)
      if (payload.visibility) {
        const fieldIds = table.fields?.flatMap((f) => f._id) ?? [];

        const fieldGroupFields = await this.fieldRepository.findMany({
          _ids: fieldIds,
          type: E_FIELD_TYPE.FIELD_GROUP,
        });

        const groupIds = fieldGroupFields
          .map((f) => f.group?._id)
          .filter((id): id is string => Boolean(id));

        if (groupIds.length > 0) {
          await this.tableRepository.updateMany({
            _ids: groupIds,
            type: E_TABLE_TYPE.FIELD_GROUP,
            data: { visibility: payload.visibility },
          });
        }
      }

      await buildTable(updated);

      return right(updated);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_TABLE_ERROR',
        ),
      );
    }
  }
}
