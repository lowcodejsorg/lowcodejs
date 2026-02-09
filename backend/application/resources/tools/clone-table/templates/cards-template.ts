import slugify from 'slugify';

import { right } from '@application/core/either.core';
import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  type IField,
} from '@application/core/entity.core';
import { buildSchema } from '@application/core/util.core';
import type { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import type { TableCreatePayload } from '@application/repositories/table/table-contract.repository';

import type {
  CloneTableDeps,
  CloneTableResponse,
  CloneTableUseCasePayload,
} from '../clone-table.types';

import { buildSimpleMediaFields } from './media-helpers';

export async function createCardsTemplate(
  payload: CloneTableUseCasePayload,
  deps: CloneTableDeps,
): Promise<CloneTableResponse> {
  const newSlug = slugify(payload.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  const { fields, orderList, orderForm } = await buildCardsFields(
    deps.fieldRepository,
  );

  const _schema = buildSchema(fields);

  const createPayload: TableCreatePayload = {
    _schema,
    name: payload.name,
    slug: newSlug,
    description: 'Cards',
    type: E_TABLE_TYPE.TABLE,
    logo: null,
    fields: fields.map((f) => f._id),
    style: E_TABLE_STYLE.CARD,
    visibility: E_TABLE_VISIBILITY.RESTRICTED,
    collaboration: E_TABLE_COLLABORATION.RESTRICTED,
    administrators: [],
    owner: payload.ownerId,
    fieldOrderList: orderList,
    fieldOrderForm: orderForm,
    methods: {
      onLoad: { code: null },
      beforeSave: { code: null },
      afterSave: { code: null },
    },
  };

  const newTable = await deps.tableRepository.create(createPayload);

  return right({
    table: newTable,
    fieldIdMap: {},
  });
}

export async function buildCardsFields(
  fieldRepository: FieldContractRepository,
): Promise<{
  fields: IField[];
  orderList: string[];
  orderForm: string[];
}> {
  const base = await buildSimpleMediaFields(fieldRepository);
  const createdFields = [...base.fields];

  const createField = async (payload: {
    name: string;
    slug: string;
    type: IField['type'];
    required: boolean;
    multiple: boolean;
    format: IField['format'];
    showInList: boolean;
    showInForm: boolean;
    showInDetail: boolean;
    showInFilter: boolean;
    defaultValue: IField['defaultValue'];
    locked: boolean;
    relationship: IField['relationship'];
    dropdown: IField['dropdown'];
    category: IField['category'];
    group: IField['group'];
    widthInForm: IField['widthInForm'];
    widthInList: IField['widthInList'];
  }): Promise<IField> => {
    const field = await fieldRepository.create({
      ...payload,
    });
    createdFields.push(field);
    return field;
  };

  const ratingField = await createField({
    name: 'Nota',
    slug: 'nota',
    type: E_FIELD_TYPE.EVALUATION,
    required: false,
    multiple: false,
    format: null,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: false,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: 50,
    widthInList: 50,
  });

  const priceField = await createField({
    name: 'Preço',
    slug: 'preco',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.DECIMAL,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: false,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: 50,
    widthInList: 50,
  });

  const categoriesField = await createField({
    name: 'Categorias',
    slug: 'categorias',
    type: E_FIELD_TYPE.CATEGORY,
    required: false,
    multiple: true,
    format: null,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: false,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: 100,
    widthInList: 100,
  });

  const orderList = [
    ...base.orderList,
    priceField._id,
    ratingField._id,
    categoriesField._id,
  ];

  const orderForm = [
    ...base.orderForm,
    priceField._id,
    ratingField._id,
    categoriesField._id,
  ];

  return {
    fields: createdFields,
    orderList,
    orderForm,
  };
}
