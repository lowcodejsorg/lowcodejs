import mongoose from 'mongoose';

import HTTPException from '@application/core/exception.core';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';

import TableRepository from '@application/repositories/table/table-mongoose.repository';
import FieldRepository from '@application/repositories/field/field-mongoose.repository';

import type { ITable } from '@application/core/entity.core';
import type { CloneTablePayload } from './clone-table.validator';

type Response = Either<
  HTTPException,
  {
    table: ITable;
    fieldIdMap: Record<string, string>;
  }
>;

export default class CloneTableUseCase {
  private readonly tableRepository = new TableRepository();
  private readonly fieldRepository = new FieldRepository();

  async execute(payload: CloneTablePayload): Promise<Response> {
    try {
      /**
	   * Buscar os dados na base conforme o _id que passei como
	   * parametro
	   */
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
	   * Inicia o processo de clonagem, removendo informações
	   * desnecessárias que serão criadas ao clonar
	   */
      const clonedTable: any = JSON.parse(JSON.stringify(baseTable));

      delete clonedTable._id;
      delete clonedTable.__v;
      delete clonedTable.createdAt;
      delete clonedTable.updatedAt;
      delete clonedTable.trashed;
      delete clonedTable.trashedAt;

      clonedTable.name = payload.name;
      clonedTable.slug = this.generateSlug(payload.name);
      clonedTable.createdAt = new Date();
      clonedTable.updatedAt = new Date();
      clonedTable.trashed = false;
      clonedTable.trashedAt = null;

      /**
	   * Agora um tratamento normalizando os fields,
	   * porque eu preciso criar novos fields, eles não pode continuar
	   * com os da tabela modelo
	   */
      const normalizedFields = this.normalizeFields(baseTable.fields);

      const {
        newFields,
        fieldIdMap,
      } = this.cloneFields(normalizedFields);

	  // Persistindo
      for (const field of newFields) {
		await this.fieldRepository.create(field);
	  }

      // Na coleção clonada so armazena os id's dos fields
      clonedTable.fields = newFields.map((f) => f._id);

      // As referencias são remapeadas na coleção
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

      // Persistindo a nova coleção/tabela
      const newTable = await this.tableRepository.create(clonedTable);

      return right({
        table: newTable,
        fieldIdMap,
      });
    } catch (error) {
      console.error('CLONE TABLE USE CASE ERROR:', error);

      return left(
        HTTPException.InternalServerError(
          'Erro ao clonar tabela',
          'CLONE_TABLE_ERROR',
        ),
      );
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  private normalizeFields(fields: unknown): any[] {
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

  private cloneFields(fields: any[]): {
    newFields: any[];
    fieldIdMap: Record<string, string>;
  } {
    const newFields: any[] = [];
    const fieldIdMap: Record<string, string> = {};

    for (const field of fields) {
      const clonedField = JSON.parse(JSON.stringify(field));

      const oldId = String(clonedField._id);
      const newId = new mongoose.Types.ObjectId();

      clonedField._id = newId;

      fieldIdMap[oldId] = String(newId);
      newFields.push(clonedField);
    }

    return {
      newFields,
      fieldIdMap,
    };
  }

  private remapFieldIds(
    ids: string[] | undefined,
    map: Record<string, string>,
  ): string[] {
    if (!Array.isArray(ids)) return [];

    return ids.map((id) => map[id]).filter(Boolean);
  }
}
