/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

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
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
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
              'Todos os administradores devem ser usuários ativos',
              'INACTIVE_ADMINISTRATORS',
              {
                administrators:
                  'Todos os administradores devem ser usuários ativos',
              },
            ),
          );
        }
      }

      // Gerar novo slug a partir do nome
      const oldSlug = table.slug;
      const newSlug = slugify(payload.name, {
        lower: true,
        strict: true,
        trim: true,
      });
      const slugChanged = newSlug !== oldSlug;

      // Verificar unicidade do novo slug
      if (slugChanged) {
        const existingTable = await this.tableRepository.findBySlug(newSlug);

        if (existingTable) {
          return left(
            HTTPException.Conflict('Tabela já existe', 'TABLE_ALREADY_EXISTS', {
              name: 'Tabela já existe',
            }),
          );
        }
      }

      // Renomear coleção e atualizar referências nos campos RELATIONSHIP
      if (slugChanged) {
        await this.tableRepository.renameSlug(oldSlug, newSlug);
        await this.fieldRepository.updateRelationshipTableSlug(
          oldSlug,
          newSlug,
        );
      }

      // Mapear propriedades populadas para strings (IDs)
      const updated = await this.tableRepository.update({
        _id: table._id,
        ...payload,
        slug: newSlug,
        owner: table.owner._id,
        style: payload.style ?? table.style,
        visibility: payload.visibility ?? table.visibility,
        collaboration: payload.collaboration ?? table.collaboration,
        fieldOrderList: payload.fieldOrderList ?? table.fieldOrderList,
        fieldOrderForm: payload.fieldOrderForm ?? table.fieldOrderForm,
        fieldOrderFilter: payload.fieldOrderFilter ?? table.fieldOrderFilter,
        fieldOrderDetail: payload.fieldOrderDetail ?? table.fieldOrderDetail,
        administrators:
          payload.administrators ?? table.administrators.flatMap((a) => a._id),
        order: payload.order !== undefined ? payload.order : table.order,
        layoutFields: payload.layoutFields ?? table.layoutFields,
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

      // Reconstruir tabelas que têm RELATIONSHIP apontando para esta
      if (slugChanged) {
        const pointingFields =
          await this.fieldRepository.findByRelationshipTableId(table._id);

        if (pointingFields.length > 0) {
          const pointingFieldIds = pointingFields.map((f) => f._id);
          const relatedTables =
            await this.tableRepository.findByFieldIds(pointingFieldIds);

          for (const relatedTable of relatedTables) {
            await buildTable(relatedTable);
          }
        }
      }

      return right(updated);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_TABLE_ERROR',
        ),
      );
    }
  }
}
