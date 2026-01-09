/* eslint-disable no-unused-vars */
import type {
  E_FIELD_TYPE,
  IField,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export type FieldCreatePayload = Pick<
  IField,
  'name' | 'slug' | 'type' | 'configuration'
>;

export type FieldUpdatePayload = Merge<
  Pick<IField, '_id'>,
  Partial<FieldCreatePayload> & {
    trashed?: boolean;
    trashedAt?: Date | null;
  }
>;

export type FieldFindByPayload = Merge<
  Partial<Pick<IField, '_id' | 'slug'>>,
  { exact: boolean }
>;

export type FieldQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  type?: ValueOf<typeof E_FIELD_TYPE>;
  _ids?: string[];
};

export abstract class FieldContractRepository {
  abstract create(payload: FieldCreatePayload): Promise<IField>;
  abstract findBy(payload: FieldFindByPayload): Promise<IField | null>;
  abstract findMany(payload?: FieldQueryPayload): Promise<IField[]>;
  abstract update(payload: FieldUpdatePayload): Promise<IField>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: FieldQueryPayload): Promise<number>;
}
