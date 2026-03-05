import slugify from 'slugify';

import { right } from '@application/core/either.core';
import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  FIELD_NATIVE_LIST,
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

export async function createCalendarTemplate(
  payload: CloneTableUseCasePayload,
  deps: CloneTableDeps,
): Promise<CloneTableResponse> {
  const newSlug = slugify(payload.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  const { fields, orderList, orderForm } = await buildCalendarFields(
    deps.fieldRepository,
  );
  const nativeFields = await deps.fieldRepository.createMany(FIELD_NATIVE_LIST);
  const nativeFieldIds = nativeFields.map((field) => field._id);

  const _schema = buildSchema([...nativeFields, ...fields]);

  const createPayload: TableCreatePayload = {
    _schema,
    name: payload.name,
    slug: newSlug,
    description: 'Calendário de agendamentos',
    type: E_TABLE_TYPE.TABLE,
    logo: null,
    fields: [...nativeFieldIds, ...fields.map((f) => f._id)],
    style: E_TABLE_STYLE.CALENDAR,
    visibility: E_TABLE_VISIBILITY.RESTRICTED,
    collaboration: E_TABLE_COLLABORATION.RESTRICTED,
    administrators: [],
    owner: payload.ownerId,
    fieldOrderList: [...nativeFieldIds, ...orderList],
    fieldOrderForm: [...nativeFieldIds, ...orderForm],
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

export async function buildCalendarFields(
  fieldRepository: FieldContractRepository,
): Promise<{
  fields: IField[];
  orderList: string[];
  orderForm: string[];
}> {
  const createdFields: IField[] = [];

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

  const titleField = await createField({
    name: 'Título',
    slug: 'titulo',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: true,
    multiple: false,
    format: E_FIELD_FORMAT.ALPHA_NUMERIC,
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

  const descriptionField = await createField({
    name: 'Descrição',
    slug: 'descricao',
    type: E_FIELD_TYPE.TEXT_LONG,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.PLAIN_TEXT,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: false,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: 100,
    widthInList: 100,
  });

  const startField = await createField({
    name: 'Data e hora de início',
    slug: 'data-inicio',
    type: E_FIELD_TYPE.DATE,
    required: true,
    multiple: false,
    format: E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS_DASH,
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

  const endField = await createField({
    name: 'Data e hora de término',
    slug: 'data-termino',
    type: E_FIELD_TYPE.DATE,
    required: true,
    multiple: false,
    format: E_FIELD_FORMAT.YYYY_MM_DD_HH_MM_SS_DASH,
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

  const colorField = await createField({
    name: 'Cor',
    slug: 'cor',
    type: E_FIELD_TYPE.DROPDOWN,
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
    dropdown: [
      { id: 'azul', label: 'Azul', color: '#2563eb' },
      { id: 'verde', label: 'Verde', color: '#16a34a' },
      { id: 'vermelho', label: 'Vermelho', color: '#dc2626' },
      { id: 'laranja', label: 'Laranja', color: '#ea580c' },
      { id: 'roxo', label: 'Roxo', color: '#7c3aed' },
      { id: 'cinza', label: 'Cinza', color: '#6b7280' },
    ],
    category: [],
    group: null,
    widthInForm: 50,
    widthInList: 50,
  });

  return {
    fields: createdFields,
    orderList: [
      titleField._id,
      startField._id,
      endField._id,
      colorField._id,
      descriptionField._id,
    ],
    orderForm: [
      titleField._id,
      descriptionField._id,
      startField._id,
      endField._id,
      colorField._id,
    ],
  };
}
