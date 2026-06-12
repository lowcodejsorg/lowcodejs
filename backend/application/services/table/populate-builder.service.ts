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

  constructor(private readonly model: ModelBuilderContractService) {}

  getRelationships(fields: IField[] = []): IField[] {
    const types = [
      E_FIELD_TYPE.RELATIONSHIP,
      E_FIELD_TYPE.FILE,
      E_FIELD_TYPE.REACTION,
      E_FIELD_TYPE.EVALUATION,
      E_FIELD_TYPE.USER,
      E_FIELD_TYPE.CREATOR,
      E_FIELD_TYPE.UPDATED_BY,
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

      if (field.type === E_FIELD_TYPE.UPDATED_BY) {
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
          if (depth > 1) {
            const relationshipFields = this.getRelationships(
              relationshipTable?.fields ?? [],
            );
            relationshipPopulate = await this.build(
              relationshipFields,
              relationshipTable?.groups ?? [],
              conn,
              depth - 1,
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
      for (const field of fields ?? []) {
        if (field.type !== E_FIELD_TYPE.FIELD_GROUP) continue;

        const groupSlug = field?.group?.slug;
        const group = groups.find((g) => g.slug === groupSlug);
        if (!group) continue;

        for (const groupField of group.fields || []) {
          if (groupField.type === E_FIELD_TYPE.USER) {
            populate.push({
              path: `${field.slug}.${groupField.slug}`,
              model: User,
              select: 'name email _id',
            });
          }

          if (groupField.type === E_FIELD_TYPE.CREATOR) {
            populate.push({
              path: `${field.slug}.${groupField.slug}`,
              model: User,
              select: 'name email _id',
            });
          }

          if (groupField.type === E_FIELD_TYPE.UPDATED_BY) {
            populate.push({
              path: `${field.slug}.${groupField.slug}`,
              model: User,
              select: 'name email _id',
            });
          }

          if (groupField.type === E_FIELD_TYPE.FILE) {
            populate.push({
              path: `${field.slug}.${groupField.slug}`,
              model: Storage,
            });
          }

          if (groupField.type === E_FIELD_TYPE.RELATIONSHIP) {
            const relationshipTableId =
              groupField?.relationship?.table?._id?.toString();
            const relationshipTableSlug = groupField?.relationship?.table?.slug;

            let groupRelationshipTable;
            if (relationshipTableId) {
              groupRelationshipTable = await Table.findOne({
                _id: relationshipTableId,
                trashed: { $ne: true },
              });
            } else if (relationshipTableSlug) {
              groupRelationshipTable = await Table.findOne({
                slug: relationshipTableSlug,
                trashed: { $ne: true },
              });
            }

            if (groupRelationshipTable && conn) {
              const relModel = await this.model.build({
                ...groupRelationshipTable.toJSON({ flattenObjectIds: true }),
                _id: groupRelationshipTable._id.toString(),
              });

              populate.push({
                path: `${field.slug}.${groupField.slug}`,
                model: relModel,
              });
            }
          }
        }
      }
    }

    return [...populate];
  }
}
