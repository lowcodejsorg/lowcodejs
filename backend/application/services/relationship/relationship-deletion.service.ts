/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IRelationshipDefinition,
  ITable,
} from '@application/core/entity.core';
import {
  E_RELATIONSHIP_CARDINALITY,
  E_RELATIONSHIP_ON_DELETE,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { RelationshipDefinitionContractRepository } from '@application/repositories/relationship-definition/relationship-definition-contract.repository';
import { RelationshipLinkContractRepository } from '@application/repositories/relationship-link/relationship-link-contract.repository';
import type { RelationshipLinkSide } from '@application/repositories/relationship-link/relationship-link-contract.repository';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import { RelationshipContractService } from './relationship-contract.service';
import { RelationshipDeletionContractService } from './relationship-deletion-contract.service';

@Service()
export default class RelationshipDeletionService implements RelationshipDeletionContractService {
  constructor(
    private readonly relationship: RelationshipContractService,
    private readonly definitionRepository: RelationshipDefinitionContractRepository,
    private readonly linkRepository: RelationshipLinkContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async applyOnDelete(
    table: ITable,
    recordId: string,
  ): Promise<Either<HTTPException, true>> {
    return this.cascade(table, recordId, new Set<string>());
  }

  async cleanupTable(tableId: string): Promise<void> {
    const definitions = await this.definitionRepository.findByTable(tableId);
    for (const definition of definitions) {
      await this.linkRepository.deleteByRelationship(definition._id);
      await this.definitionRepository.delete(definition._id);
    }
  }

  // ── interno ───────────────────────────────────────────────

  private async cascade(
    table: ITable,
    recordId: string,
    visited: Set<string>,
  ): Promise<Either<HTTPException, true>> {
    const key = `${table._id}:${recordId}`;
    if (visited.has(key)) return right(true);
    visited.add(key);

    const definitions = await this.definitionRepository.findByTable(table._id);

    // Pass 1 — RESTRICT bloqueia antes de qualquer remocao.
    for (const definition of definitions) {
      if (definition.onDelete !== E_RELATIONSHIP_ON_DELETE.RESTRICT) continue;
      const count = await this.linkRepository.countByRecord(
        definition._id,
        recordId,
      );
      if (count > 0) {
        return left(
          HTTPException.Conflict(
            'Não é possível excluir: existe vínculo que impede a remoção',
            'RELATIONSHIP_DELETE_RESTRICT',
          ),
        );
      }
    }

    // Pass 2 — aplica SET_NULL / CASCADE.
    for (const definition of definitions) {
      if (definition.onDelete === E_RELATIONSHIP_ON_DELETE.SET_NULL) {
        await this.linkRepository.deleteByRecord(definition._id, recordId);
        continue;
      }
      if (definition.onDelete === E_RELATIONSHIP_ON_DELETE.CASCADE) {
        const applied = await this.applyCascade(
          definition,
          table._id,
          recordId,
          visited,
        );
        if (applied.isLeft()) return applied;
      }
    }

    return right(true);
  }

  private async applyCascade(
    definition: IRelationshipDefinition,
    tableId: string,
    recordId: string,
    visited: Set<string>,
  ): Promise<Either<HTTPException, true>> {
    const sourceField = await this.fieldRepository.findById(
      definition.source.field._id,
    );
    const targetField = await this.fieldRepository.findById(
      definition.target.field._id,
    );
    const cardinality = this.relationship.cardinalityOf(
      { multiple: Boolean(sourceField?.multiple) },
      { multiple: Boolean(targetField?.multiple) },
    );

    // N:N — sem pai/filho: remove apenas os links do registro.
    if (cardinality === E_RELATIONSHIP_CARDINALITY.MANY_TO_MANY) {
      await this.linkRepository.deleteByRecord(definition._id, recordId);
      return right(true);
    }

    // Lados que o registro ocupa (ambos em auto-relacionamento, §4.5).
    const sides: RelationshipLinkSide[] = [];
    if (definition.source.table._id === tableId) sides.push('source');
    if (definition.target.table._id === tableId) sides.push('target');

    for (const side of sides) {
      // 1:1 e simetrico; 1:N o pai e o lado que aceita multiplos (§3/§9).
      let isParent = cardinality === E_RELATIONSHIP_CARDINALITY.ONE_TO_ONE;
      if (side === 'source' && Boolean(sourceField?.multiple)) isParent = true;
      if (side === 'target' && Boolean(targetField?.multiple)) isParent = true;
      if (!isParent) continue;

      let childTableId = definition.source.table._id;
      if (side === 'source') childTableId = definition.target.table._id;

      const childTable = await this.tableRepository.findById(childTableId);
      if (!childTable) continue;

      const childIds = await this.relationship.resolveLinkedIds(
        definition,
        recordId,
        side,
      );

      for (const childId of childIds) {
        const childKey = `${childTableId}:${childId}`;
        if (visited.has(childKey)) continue;

        const cascaded = await this.cascade(childTable, childId, visited);
        if (cascaded.isLeft()) return cascaded;
        await this.rowRepository.deleteOne(childTable, childId);
      }
    }

    // Remove os links remanescentes que tocam o registro nesta definicao.
    await this.linkRepository.deleteByRecord(definition._id, recordId);
    return right(true);
  }
}
