import { Table } from '@application/model/table.model';

import type { IField, IGroupConfiguration } from '../entity.core';
import { E_FIELD_TYPE } from '../entity.core';

import { findReverseRelationships, buildTable } from './model-builder';

export function getRelationship(fields: IField[] = []): IField[] {
  const types = [
    E_FIELD_TYPE.RELATIONSHIP,
    E_FIELD_TYPE.FILE,
    E_FIELD_TYPE.REACTION,
    E_FIELD_TYPE.EVALUATION,
    E_FIELD_TYPE.USER,
    E_FIELD_TYPE.CREATOR,
  ];

  return fields.filter(
    (field) => field.type && types.some((t) => t === field.type),
  );
}

export async function buildPopulate(
  fields?: IField[],
  groups?: IGroupConfiguration[],
  tableSlug?: string,
): Promise<{ path: string; model?: string; select?: string }[]> {
  const relacionamentos = getRelationship(fields);
  const populate = [];

  for await (const field of relacionamentos) {
    if (
      field.type !== E_FIELD_TYPE.FIELD_GROUP &&
      field.type !== E_FIELD_TYPE.REACTION &&
      field.type !== E_FIELD_TYPE.EVALUATION &&
      field.type !== E_FIELD_TYPE.RELATIONSHIP &&
      field.type !== E_FIELD_TYPE.USER &&
      field.type !== E_FIELD_TYPE.CREATOR
    ) {
      populate.push({
        path: field.slug,
      });
    }

    if (field.type === E_FIELD_TYPE.USER) {
      populate.push({
        path: field.slug,
        model: 'User',
        select: 'name email _id',
      });
    }

    if (field.type === E_FIELD_TYPE.CREATOR) {
      populate.push({
        path: field.slug,
        model: 'User',
        select: 'name email _id',
      });
    }

    if (field.type === E_FIELD_TYPE.REACTION) {
      populate.push({
        path: field.slug,
        select: 'user type',
      });
    }

    if (field.type === E_FIELD_TYPE.EVALUATION) {
      populate.push({
        path: field.slug,
        select: 'user value',
      });
    }

    if (field.type === E_FIELD_TYPE.RELATIONSHIP) {
      const relationshipTableId = field?.relationship?.table?._id?.toString();
      const relationshipTable = await Table.findOne({
        _id: relationshipTableId,
      });

      if (relationshipTable) {
        await buildTable({
          ...relationshipTable.toJSON({
            flattenObjectIds: true,
          }),
          _id: relationshipTable._id.toString(),
        });

        const relationshipFields = getRelationship(
          relationshipTable?.fields as IField[],
        );
        const relationshipPopulate = await buildPopulate(
          relationshipFields,
          relationshipTable?.groups as IGroupConfiguration[],
        );

        populate.push({
          path: field.slug,
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
            model: 'User',
            select: 'name email _id',
          });
        }

        if (groupField.type === E_FIELD_TYPE.CREATOR) {
          populate.push({
            path: `${field.slug}.${groupField.slug}`,
            model: 'User',
            select: 'name email _id',
          });
        }

        if (groupField.type === E_FIELD_TYPE.FILE) {
          populate.push({
            path: `${field.slug}.${groupField.slug}`,
            model: 'Storage',
          });
        }

        if (groupField.type === E_FIELD_TYPE.RELATIONSHIP) {
          const relationshipTableId =
            groupField?.relationship?.table?._id?.toString();
          if (relationshipTableId) {
            const relationshipTable = await Table.findOne({
              _id: relationshipTableId,
            });

            if (relationshipTable) {
              await buildTable({
                ...relationshipTable.toJSON({ flattenObjectIds: true }),
                _id: relationshipTable._id.toString(),
              });

              populate.push({
                path: `${field.slug}.${groupField.slug}`,
                model: relationshipTable.slug,
              });
            }
          }
        }
      }
    }
  }

  // === VIRTUAL POPULATE (Relacionamentos Reversos) ===
  if (tableSlug) {
    const reverseRelationships = await findReverseRelationships(tableSlug);

    for (const rel of reverseRelationships) {
      const sourceTable = await Table.findOne({
        slug: rel.sourceTableSlug,
        trashed: { $ne: true },
      }).populate('fields');

      if (sourceTable) {
        await buildTable({
          ...sourceTable.toJSON({ flattenObjectIds: true }),
          _id: sourceTable._id.toString(),
        });

        const relationshipSlugs = (sourceTable.fields as IField[])
          .filter(
            (f) =>
              f.type === E_FIELD_TYPE.RELATIONSHIP && f.slug !== rel.fieldSlug,
          )
          .map((f) => `-${f.slug}`);

        populate.push({
          path: rel.virtualName,
          ...(relationshipSlugs.length > 0 && {
            select: relationshipSlugs.join(' '),
          }),
          transform: (doc: any) => {
            if (!doc) return doc;
            const obj = doc.toObject ? doc.toObject() : { ...doc };
            delete obj[rel.fieldSlug];
            return obj;
          },
        });
      }
    }
  }

  return [...populate];
}
