/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_USER_STATUS,
  type ITable as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { TableSchemaContractService } from '@application/services/table-schema/table-schema-contract.service';

import type { TableUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableUpdatePayload;

@Service()
export default class TableUpdateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly tableSchemaService: TableSchemaContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

      if (payload.owner) {
        const currentOwnerId =
          typeof table.owner === 'string'
            ? table.owner
            : table.owner?._id?.toString();
        if (payload.owner !== currentOwnerId) {
          const newOwner = await this.userRepository.findById(payload.owner);
          if (
            !newOwner ||
            newOwner.status !== E_USER_STATUS.ACTIVE ||
            newOwner.trashed === true
          ) {
            return left(
              HTTPException.BadRequest(
                'Usuário de owner inválido ou inativo',
                'INVALID_OWNER',
                { owner: 'Usuário de owner inválido ou inativo' },
              ),
            );
          }
        }
      }

      // Validar que colaboradores referenciados sao usuarios ativos
      if (payload.collaborators && payload.collaborators.length > 0) {
        const userIds = payload.collaborators.map((c) => c.user);
        const activeUsers = await this.userRepository.findMany({
          _ids: userIds,
          status: E_USER_STATUS.ACTIVE,
          trashed: false,
        });

        if (activeUsers.length !== userIds.length) {
          return left(
            HTTPException.BadRequest(
              'Todos os colaboradores devem ser usuários ativos',
              'INACTIVE_COLLABORATORS',
              {
                collaborators:
                  'Todos os colaboradores devem ser usuários ativos',
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

      // Renomear colecao e atualizar referencias nos campos RELATIONSHIP
      if (slugChanged) {
        await this.tableRepository.renameSlug(oldSlug, newSlug);
        await this.fieldRepository.updateRelationshipTableSlug(
          oldSlug,
          newSlug,
        );
      }

      const updated = await this.tableRepository.update({
        _id: table._id,
        ...payload,
        slug: newSlug,
        owner: payload.owner ?? table.owner._id,
        style: payload.style ?? table.style,
        viewTable: payload.viewTable ?? table.viewTable,
        updateTable: payload.updateTable ?? table.updateTable,
        createField: payload.createField ?? table.createField,
        updateField: payload.updateField ?? table.updateField,
        removeField: payload.removeField ?? table.removeField,
        viewField: payload.viewField ?? table.viewField,
        createRow: payload.createRow ?? table.createRow,
        updateRow: payload.updateRow ?? table.updateRow,
        removeRow: payload.removeRow ?? table.removeRow,
        viewRow: payload.viewRow ?? table.viewRow,
        collaborators: payload.collaborators ?? [],
        fieldOrderList: payload.fieldOrderList ?? table.fieldOrderList,
        fieldOrderForm: payload.fieldOrderForm ?? table.fieldOrderForm,
        fieldOrderFilter: payload.fieldOrderFilter ?? table.fieldOrderFilter,
        fieldOrderDetail: payload.fieldOrderDetail ?? table.fieldOrderDetail,
        order: payload.order !== undefined ? payload.order : table.order,
        layoutFields: payload.layoutFields ?? table.layoutFields,
      });

      await this.tableSchemaService.syncModel(updated);

      // Reconstruir tabelas que tem RELATIONSHIP apontando para esta
      if (slugChanged) {
        const pointingFields =
          await this.fieldRepository.findByRelationshipTableId(table._id);

        if (pointingFields.length > 0) {
          const pointingFieldIds = pointingFields.flatMap((f) => f._id);
          const relatedTables =
            await this.tableRepository.findByFieldIds(pointingFieldIds);

          for (const relatedTable of relatedTables) {
            await this.tableSchemaService.syncModel(relatedTable);
          }
        }
      }

      return right(updated);
    } catch (error) {
      console.error('[table-base > update][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_TABLE_ERROR',
        ),
      );
    }
  }
}
