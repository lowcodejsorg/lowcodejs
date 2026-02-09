/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  type ITable as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableCreatePayload;

@Service()
export default class TableCreateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!payload.owner)
        return left(
          HTTPException.BadRequest('Owner required', 'OWNER_REQUIRED'),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existingTable = await this.tableRepository.findBy({
        slug,
        exact: true,
      });

      if (existingTable)
        return left(
          HTTPException.Conflict(
            'Table already exists',
            'TABLE_ALREADY_EXISTS',
          ),
        );

      const _schema = buildSchema([]);

      const created = await this.tableRepository.create({
        ...payload,
        _schema,
        slug,
        fields: [],
        type: E_TABLE_TYPE.TABLE,
        owner: payload.owner,
        administrators: [],
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        style: payload.style ?? E_TABLE_STYLE.LIST,
        visibility: payload.visibility ?? E_TABLE_VISIBILITY.RESTRICTED,
        fieldOrderForm: [],
        fieldOrderList: [],
      });

      const nativeFields = await this.fieldRepository.createMany([
        {
          name: 'ID',
          slug: '_id',
          type: E_FIELD_TYPE.TEXT_SHORT,
          native: true,
          locked: true,
          required: false,
          multiple: false,
          format: null,
          showInList: true,
          showInFilter: false,
          showInForm: false,
          showInDetail: false,
          widthInForm: null,
          widthInList: 50,
          defaultValue: null,
          relationship: null,
          dropdown: [],
          category: [],
          group: null,
        },
        {
          name: 'Criador',
          slug: 'creator',
          type: E_FIELD_TYPE.USER,
          native: true,
          locked: true,
          required: false,
          multiple: false,
          format: null,
          showInList: true,
          showInFilter: false,
          showInForm: false,
          showInDetail: false,
          widthInForm: null,
          widthInList: 50,
          defaultValue: null,
          relationship: null,
          dropdown: [],
          category: [],
          group: null,
        },
        {
          name: 'Criado em',
          slug: 'createdAt',
          type: E_FIELD_TYPE.DATE,
          native: true,
          locked: true,
          required: false,
          multiple: false,
          format: E_FIELD_FORMAT.DD_MM_YYYY_HH_MM_SS,
          showInList: true,
          showInFilter: false,
          showInForm: false,
          showInDetail: false,
          widthInForm: null,
          widthInList: 50,
          defaultValue: null,
          relationship: null,
          dropdown: [],
          category: [],
          group: null,
        },
      ]);

      await this.tableRepository.update({
        _id: created._id,
        fields: nativeFields.map((f) => f._id),
      });

      return right({
        ...created,
        fields: nativeFields,
      });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_TABLE_ERROR',
        ),
      );
    }
  }
}
