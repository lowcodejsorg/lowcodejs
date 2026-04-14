/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_FIELD_VISIBILITY_VALUE,
  E_TABLE_ACTION_VALUE,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  FIELD_NATIVE_LIST,
  type ITable as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { TableSchemaContractService } from '@application/services/table-schema/table-schema-contract.service';

import type { TableCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableCreatePayload;

@Service()
export default class TableCreateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly tableSchemaService: TableSchemaContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload.owner) {
        return left(
          HTTPException.BadRequest(
            'Proprietário é obrigatório',
            'OWNER_REQUIRED',
          ),
        );
      }

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existingTable = await this.tableRepository.findBySlug(slug);

      if (existingTable) {
        return left(
          HTTPException.Conflict('Tabela já existe', 'TABLE_ALREADY_EXISTS', {
            name: 'Tabela já existe',
          }),
        );
      }

      const nativeFields = await this.fieldRepository.createMany([
        ...FIELD_NATIVE_LIST,
        {
          name: 'Nome',
          slug: 'nome',
          type: E_FIELD_TYPE.TEXT_SHORT,
          native: false,
          locked: false,
          required: true,
          multiple: false,
          format: E_FIELD_FORMAT.ALPHA_NUMERIC,
          visibilityList: E_FIELD_VISIBILITY_VALUE.HIDDEN,
          visibilityForm: E_FIELD_VISIBILITY_VALUE.HIDDEN,
          visibilityDetail: E_FIELD_VISIBILITY_VALUE.HIDDEN,
          widthInForm: 50,
          widthInList: 10,
          widthInDetail: null,
          defaultValue: null,
          relationship: null,
          dropdown: [],
          category: [],
          group: null,
        },
      ]);

      const nativeFieldIds = nativeFields.flatMap((f) => f._id);

      const _schema = this.tableSchemaService.computeSchema(nativeFields);

      const created = await this.tableRepository.create({
        ...payload,
        _schema,
        slug,
        fields: [],
        type: E_TABLE_TYPE.TABLE,
        owner: payload.owner,
        collaborators: [],
        style: payload.style ?? E_TABLE_STYLE.LIST,
        viewTable: payload.viewTable ?? E_TABLE_ACTION_VALUE.NOBODY,
        updateTable: payload.updateTable ?? E_TABLE_ACTION_VALUE.NOBODY,
        createField: payload.createField ?? E_TABLE_ACTION_VALUE.NOBODY,
        updateField: payload.updateField ?? E_TABLE_ACTION_VALUE.NOBODY,
        removeField: payload.removeField ?? E_TABLE_ACTION_VALUE.NOBODY,
        viewField: payload.viewField ?? E_TABLE_ACTION_VALUE.NOBODY,
        createRow: payload.createRow ?? E_TABLE_ACTION_VALUE.NOBODY,
        updateRow: payload.updateRow ?? E_TABLE_ACTION_VALUE.NOBODY,
        removeRow: payload.removeRow ?? E_TABLE_ACTION_VALUE.NOBODY,
        viewRow: payload.viewRow ?? E_TABLE_ACTION_VALUE.NOBODY,
        fieldOrderForm: [],
        fieldOrderList: [],
        fieldOrderFilter: [],
        fieldOrderDetail: [],
      });

      await this.tableRepository.update({
        _id: created._id,
        fields: nativeFieldIds,
        fieldOrderList: nativeFieldIds,
        fieldOrderForm: nativeFieldIds,
        fieldOrderFilter: nativeFieldIds,
        fieldOrderDetail: nativeFieldIds,
      });

      return right({
        ...created,
        fields: nativeFields,
      });
    } catch (error) {
      console.error('[table-base > create][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_TABLE_ERROR',
        ),
      );
    }
  }
}
