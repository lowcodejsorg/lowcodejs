import { Service } from 'typedi';
import mongoose, { Types } from 'mongoose';
import slugify from 'slugify';

import HTTPException from '@application/core/exception.core';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';

import type { ITable } from '@application/core/entity.core';
import type { CloneTablePayload } from './clone-table.validator';

import type {
  TableContractRepository,
  TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';

import type {
  FieldContractRepository,
} from '@application/repositories/field/field-contract.repository';

export type CloneTableUseCasePayload =
  CloneTablePayload & {
    ownerId: string;
  };

type Response = Either<
  HTTPException,
  {
    table: ITable;
    fieldIdMap: Record<string, string>;
  }
>;

type TableToPersist = Omit<
  ITable,
  '_id' | '__v' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
> & {
  fields: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  trashed: boolean;
  trashedAt: Date | null;
};

@Service()
export default class CloneTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(
    payload: CloneTableUseCasePayload,
  ): Promise<Response> {
    try {
      const baseTable = await this.tableRepository.findBy({
        _id: payload.baseTableId,
        exact: true,
      });

      if (!baseTable) {
        return left(
          HTTPException.NotFound(
            'Tabela base não encontrada',
            'TABLE_NOT_FOUND',
          ),
        );
      }

      /**
       * structuredClone
       * Garante que nenhuma mutação afete a baseTable
       */
      const baseClone = structuredClone(baseTable);

      const clonedTable: TableToPersist = {
        ...baseClone,
        name: payload.name,
        slug: slugify(payload.name, {
          lower: true,
          strict: true,
          trim: true,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
        trashed: false,
        trashedAt: null,
        configuration: {
          ...baseClone.configuration,
          owner: payload.ownerId,
        },
      };

      /**
       * Clone e persistência dos fields
       */
      const {
        newFields,
        fieldIdMap,
      } = this.cloneFields(
        this.normalizeFields(baseClone.fields),
      );

      for (const field of newFields) {
        await this.fieldRepository.create(field);
      }

      clonedTable.fields = newFields.map(
        (field) => field._id,
      );

      /**
       * Remapeamento das referências internas
       */
      if (clonedTable.configuration?.fields) {
        clonedTable.configuration.fields.orderList =
          this.remapFieldIds(
            clonedTable.configuration.fields.orderList,
            fieldIdMap,
          );

        clonedTable.configuration.fields.orderForm =
          this.remapFieldIds(
            clonedTable.configuration.fields.orderForm,
            fieldIdMap,
          );
      }

      /**
       * Payload final respeitando o contrato do repositório
       */
      const createPayload: TableCreatePayload = {
        name: clonedTable.name,
        slug: clonedTable.slug,
        description: clonedTable.description ?? null,
        type: clonedTable.type,
        logo: clonedTable.logo ?? null,
        fields: clonedTable.fields,
        configuration: clonedTable.configuration,
        methods: clonedTable.methods,
        trashed: clonedTable.trashed,
        trashedAt: clonedTable.trashedAt,
      };

      const newTable =
        await this.tableRepository.create(createPayload);

      return right({
        table: newTable,
        fieldIdMap,
      });
    } catch (error) {
      console.error(
        'CLONE TABLE USE CASE ERROR:',
        error,
      );

      return left(
        HTTPException.InternalServerError(
          'Erro ao clonar tabela',
          'CLONE_TABLE_ERROR',
        ),
      );
    }
  }

  /**
   * Normaliza fields vindos do banco
   */
  private normalizeFields(fields: unknown): unknown[] {
    if (!fields) return [];

    if (Array.isArray(fields)) return fields;

    if (typeof fields === 'string') {
      try {
        return JSON.parse(fields);
      } catch {
        throw new Error('INVALID_FIELDS_FORMAT');
      }
    }

    throw new Error('UNSUPPORTED_FIELDS_TYPE');
  }

  /**
   * Clona fields gerando novos ObjectIds
   */
  private cloneFields(
    fields: unknown[],
  ): {
    newFields: { _id: Types.ObjectId }[];
    fieldIdMap: Record<string, string>;
  } {
    const newFields: { _id: Types.ObjectId }[] = [];
    const fieldIdMap: Record<string, string> = {};

    type FieldWithId = {
      _id: Types.ObjectId | string;
      [key: string]: unknown;
    };

    for (const field of fields as FieldWithId[]) {
      const newId = new mongoose.Types.ObjectId();

      fieldIdMap[String(field._id)] = String(newId);

      newFields.push({
        ...field,
        _id: newId,
      });
    }

    return { newFields, fieldIdMap };
  }

  /**
   * Remapeia listas de IDs usando o mapa antigo -> novo
   */
  private remapFieldIds(
    ids: string[] | undefined,
    map: Record<string, string>,
  ): string[] {
    if (!Array.isArray(ids)) return [];

    return ids.map((id) => map[id]).filter(Boolean);
  }
}
