/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type mongoose from 'mongoose';

import type {
  IField,
  IGroupConfiguration,
} from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import { Evaluation } from '@application/model/evaluation.model';
import { Reaction } from '@application/model/reaction.model';
import { Storage } from '@application/model/storage.model';
import { Table } from '@application/model/table.model';
import { User } from '@application/model/user.model';

import { FieldGroupBuilderContractService } from './field-group-builder-contract.service';
import { ModelBuilderContractService } from './model-builder-contract.service';
import { PopulateBuilderContractService } from './populate-builder-contract.service';

@Service()
export default class MongoosePopulateBuilder implements PopulateBuilderContractService {
  /**
   * Profundidade maxima de populate aninhado de relacionamentos.
   * Limita o quanto navegamos em relacionamentos-de-relacionamentos ao montar
   * labels customizados (paths como `fornecedor.cidade.uf`) e, principalmente,
   * evita recursao infinita em esquemas ciclicos (ex: localizacao.pai -> localizacao).
   */
  private static readonly MAX_RELATIONSHIP_DEPTH = 5;

  constructor(
    private readonly model: ModelBuilderContractService,
    private readonly fieldGroup: FieldGroupBuilderContractService,
  ) {}

  getRelationships(fields: IField[] = []): IField[] {
    const types = [
      E_FIELD_TYPE.RELATIONSHIP,
      E_FIELD_TYPE.FILE,
      E_FIELD_TYPE.REACTION,
      E_FIELD_TYPE.EVALUATION,
      E_FIELD_TYPE.USER,
      E_FIELD_TYPE.CREATOR,
      E_FIELD_TYPE.UPDATER,
    ];

    return fields.filter(
      (field) => field.type && types.some((t) => t === field.type),
    );
  }

  async build(
    fields?: IField[],
    groups?: IGroupConfiguration[],
    conn?: mongoose.Connection,
    depth: number = MongoosePopulateBuilder.MAX_RELATIONSHIP_DEPTH,
    visited: Set<string> = new Set(),
  ): Promise<mongoose.PopulateOptions[]> {
    const relacionamentos = this.getRelationships(fields);
    const populate = [];

    for await (const field of relacionamentos) {
      if (field.type === E_FIELD_TYPE.FILE) {
        populate.push({
          path: field.slug,
          model: Storage,
        });
      }

      if (field.type === E_FIELD_TYPE.USER) {
        populate.push({
          path: field.slug,
          model: User,
          select: 'name email _id',
        });
      }

      if (field.type === E_FIELD_TYPE.CREATOR) {
        populate.push({
          path: field.slug,
          model: User,
          select: 'name email _id',
        });
      }

      if (field.type === E_FIELD_TYPE.UPDATER) {
        populate.push({
          path: field.slug,
          model: User,
          select: 'name email _id',
        });
      }

      if (field.type === E_FIELD_TYPE.REACTION) {
        populate.push({
          path: field.slug,
          model: Reaction,
          select: 'user type',
        });
      }

      if (field.type === E_FIELD_TYPE.EVALUATION) {
        populate.push({
          path: field.slug,
          model: Evaluation,
          select: 'user value',
        });
      }

      if (field.type === E_FIELD_TYPE.RELATIONSHIP) {
        // Campo não-materializado (sem relationshipId) não tem ref válida para
        // expandir aqui; segui-lo recompila model dinâmico por nível e recursa
        // em esquema cíclico, estourando o heap. A hidratação real é por links
        // (relationship-builder). Pula.
        if (!field?.relationship?.relationshipId) continue;

        const relationshipTableId = field?.relationship?.table?._id?.toString();
        const relationshipTableSlug = field?.relationship?.table?.slug;

        let relationshipTable;
        if (relationshipTableId) {
          relationshipTable = await Table.findOne({
            _id: relationshipTableId,
            trashed: { $ne: true },
          }).populate(['fields', 'groups.fields']);
        } else if (relationshipTableSlug) {
          relationshipTable = await Table.findOne({
            slug: relationshipTableSlug,
            trashed: { $ne: true },
          }).populate(['fields', 'groups.fields']);
        }

        if (relationshipTable && conn) {
          const relationModel = await this.model.build({
            ...relationshipTable.toJSON({
              flattenObjectIds: true,
            }),
            _id: relationshipTable._id.toString(),
          });

          let relationshipPopulate: mongoose.PopulateOptions[] = [];
          const nextTableId = relationshipTable._id.toString();
          // Guard de ciclo: só aprofunda se o alvo ainda não está na cadeia
          // ancestral (evita A→B→A expandir N níveis recompilando models).
          if (depth > 1 && !visited.has(nextTableId)) {
            const relationshipFields = this.getRelationships(
              relationshipTable?.fields ?? [],
            );
            const nextVisited = new Set(visited);
            nextVisited.add(nextTableId);
            relationshipPopulate = await this.build(
              relationshipFields,
              relationshipTable?.groups ?? [],
              conn,
              depth - 1,
              nextVisited,
            );
          }

          populate.push({
            path: field.slug,
            model: relationModel,
            ...(relationshipPopulate.length > 0 && {
              populate: relationshipPopulate,
            }),
          });
        }
      }
    }

    if (groups) {
      populate.push(...this.fieldGroup.buildPopulate(fields ?? [], groups));
    }

    return [...populate];
  }
}
