/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type { RootFilterQuery, SortOrder } from 'mongoose';
import mongoose from 'mongoose';

import type {
  IField,
  IGroupConfiguration,
  IRow,
} from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';

import { FieldGroupBuilderContractService } from './field-group-builder-contract.service';
import { QueryBuilderContractService } from './query-builder-contract.service';

export type Query = Record<string, unknown>;

export type QueryOrder = Record<
  string,
  | number
  | string
  | boolean
  | null
  | unknown
  | RootFilterQuery<IRow>
  | QueryOrder[]
>;

@Service()
export default class MongooseQueryBuilder implements QueryBuilderContractService {
  constructor(private readonly fieldGroup: FieldGroupBuilderContractService) {}

  normalize(search: string): string {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escapedSearch
      .replace(/a/gi, '[aáàâãä]')
      .replace(/e/gi, '[eéèêë]')
      .replace(/i/gi, '[iíìîï]')
      .replace(/o/gi, '[oóòôõö]')
      .replace(/u/gi, '[uúùûü]')
      .replace(/c/gi, '[cç]')
      .replace(/n/gi, '[nñ]');
  }

  async build(
    {
      search,
      trashed,
      page: _page,
      perPage: _perPage,
      slug: _slug,
      public: _public,
      ...payload
    }: Partial<Query>,
    fields: IField[] = [],
    groups?: IGroupConfiguration[],
    tableSlug?: string,
    conn?: mongoose.Connection,
  ): Promise<Query> {
    let query: Query = {
      trashedAt: null,
    };

    if (trashed === 'true') {
      query = {
        trashedAt: { $ne: null },
      };
    }

    for (const field of fields.filter(
      (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP,
    )) {
      const slug = String(field.slug?.toString());

      if (
        (field.type === E_FIELD_TYPE.TEXT_SHORT ||
          field.type === E_FIELD_TYPE.TEXT_LONG) &&
        payload[slug]
      ) {
        query[slug] = {
          $regex: this.normalize(String(payload[slug])),
          $options: 'i',
        };
      }

      if (
        (field.type === E_FIELD_TYPE.RELATIONSHIP ||
          field.type === E_FIELD_TYPE.DROPDOWN ||
          field.type === E_FIELD_TYPE.CATEGORY ||
          field.type === E_FIELD_TYPE.USER ||
          field.type === E_FIELD_TYPE.CREATOR ||
          field.type === E_FIELD_TYPE.UPDATER) &&
        payload[slug]
      ) {
        query[slug] = {
          $in: String(payload[slug]).split(','),
        };
      }

      if (
        field.type === E_FIELD_TYPE.DATE ||
        field.type === E_FIELD_TYPE.CREATED_AT ||
        field.type === E_FIELD_TYPE.UPDATED_AT
      ) {
        const initialKey = `${slug}-initial`;
        const finalKey = `${slug}-final`;
        const dateFilter: { $gte?: Date; $lte?: Date } = {};

        if (payload[initialKey]) {
          const initial = new Date(String(payload[initialKey]));
          dateFilter.$gte = new Date(initial.setUTCHours(0, 0, 0, 0));
        }

        if (payload[finalKey]) {
          const final = new Date(String(payload[finalKey]));
          dateFilter.$lte = new Date(final.setUTCHours(23, 59, 59, 999));
        }

        if (dateFilter.$gte || dateFilter.$lte) {
          query[field.slug] = dateFilter;
        }
      }
    }

    // Filtros sobre campos dentro de FIELD_GROUP (dot notation, embedded docs)
    // sao montados pelo seam dedicado e mesclados na query principal.
    Object.assign(query, this.fieldGroup.buildFilter(payload, fields, groups));

    if (search) {
      const searchStr = String(search);
      const searchQuery: Query[] = [];

      for (const field of fields.filter(
        (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP && !f.native,
      )) {
        if (
          field?.type === E_FIELD_TYPE.TEXT_LONG ||
          field?.type === E_FIELD_TYPE.TEXT_SHORT
        ) {
          const slug = String(field.slug?.toString());
          searchQuery.push({
            [slug]: {
              $regex: this.normalize(searchStr),
              $options: 'i',
            },
          });
        }
      }

      searchQuery.push(
        ...this.fieldGroup.buildSearch(searchStr, fields, groups),
      );

      if (searchQuery.length > 0) {
        query = {
          $and: [{ ...query }, { $or: searchQuery }],
        };
      }
    }

    return query;
  }

  order(
    query: Partial<QueryOrder>,
    fields: IField[] = [],
    tableOrder?: { field: string; direction: 'asc' | 'desc' } | null,
  ): {
    [key: string]: SortOrder;
  } {
    const order: { [key: string]: SortOrder } = {};

    for (const col of fields) {
      if (!col?.type || !col.slug) continue;

      const queryKey = 'order-'.concat(col.slug);

      if (queryKey in query) {
        const sortValue = query[queryKey]?.toString();
        order[col.slug] = sortValue === 'asc' ? 1 : -1;
      }
    }

    if (Object.keys(order).length === 0 && tableOrder?.field) {
      order[tableOrder.field] = tableOrder.direction === 'asc' ? 1 : -1;
    }

    return order;
  }
}
