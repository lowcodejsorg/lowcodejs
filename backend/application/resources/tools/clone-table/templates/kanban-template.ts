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
  type IGroupConfiguration,
} from '@application/core/entity.core';
import { buildSchema } from '@application/core/util.core';
import type { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import type { TableCreatePayload } from '@application/repositories/table/table-contract.repository';

import type {
  CloneTableDeps,
  CloneTableResponse,
  CloneTableUseCasePayload,
} from '../clone-table.types';

export async function createKanbanTemplate(
  payload: CloneTableUseCasePayload,
  deps: CloneTableDeps,
): Promise<CloneTableResponse> {
  const newSlug = slugify(payload.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  const { fields, groups, orderList, orderForm, orderFilter, orderDetail } = await buildKanbanFields(
    deps.fieldRepository,
  );
  const nativeFields = await deps.fieldRepository.createMany(FIELD_NATIVE_LIST);
  const nativeFieldIds = nativeFields.map((field) => field._id);

  const _schema = buildSchema([...nativeFields, ...fields], groups);

  const createPayload: TableCreatePayload = {
    _schema,
    name: payload.name,
    slug: newSlug,
    description: 'Kanban de tarefas',
    type: E_TABLE_TYPE.TABLE,
    logo: null,
    fields: [...nativeFieldIds, ...fields.map((f) => f._id)],
    style: E_TABLE_STYLE.KANBAN,
    visibility: E_TABLE_VISIBILITY.RESTRICTED,
    collaboration: E_TABLE_COLLABORATION.RESTRICTED,
    administrators: [],
    owner: payload.ownerId,
    fieldOrderList: [...nativeFieldIds, ...orderList],
    fieldOrderForm: [...nativeFieldIds, ...orderForm],
    fieldOrderFilter: [...nativeFieldIds, ...orderFilter],
    fieldOrderDetail: [...nativeFieldIds, ...orderDetail],
    methods: {
      onLoad: { code: null },
      beforeSave: {
        code: `
(async () => {
const membros = field.get('membros') || [];
const emails = Array.isArray(membros)
  ? membros
      .map((m) => {
        if (m && typeof m === 'object') return m.email || null;
        if (typeof m === 'string' && m.includes('@')) return m;
        return null;
      })
      .filter(Boolean)
  : [];

const prevRaw = field.get('membros-notificados') || '[]';
let prev = [];
try {
  prev = Array.isArray(prevRaw) ? prevRaw : JSON.parse(prevRaw);
} catch (e) {
  prev = [];
}
const prevSet = new Set(prev.filter(Boolean));
const newEmails = emails.filter((e) => !prevSet.has(e));
if (newEmails.length > 0) {
  await email.send(
    newEmails,
    'Você foi adicionado a uma tarefa',
    'Você foi adicionado como membro em uma tarefa do kanban.'
  );
  field.set(
    'membros-notificados',
    JSON.stringify([...prevSet, ...newEmails])
  );
}

const progresso = Number(field.get('porcentagem-concluida') || 0);
const notificado = field.get('concluido-notificado') === 'true';
if (progresso >= 100 && !notificado) {
  if (emails.length > 0) {
    await email.send(
      emails,
      'Tarefa concluída',
      'A tarefa foi concluída (100%).'
    );
  }
  field.set('concluido-notificado', 'true');
}
if (progresso < 100 && notificado) {
  field.set('concluido-notificado', 'false');
}
})();
        `.trim(),
      },
      afterSave: { code: null },
    },
    groups,
  };

  const newTable = await deps.tableRepository.create(createPayload);

  return right({
    table: newTable,
    fieldIdMap: {},
  });
}

export async function buildKanbanFields(
  fieldRepository: FieldContractRepository,
): Promise<{
  fields: IField[];
  groups: IGroupConfiguration[];
  orderList: string[];
  orderForm: string[];
  orderFilter: string[];
  orderDetail: string[];
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
    widthInDetail: IField['widthInDetail'];
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
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const descriptionField = await createField({
    name: 'Descrição',
    slug: 'descricao',
    type: E_FIELD_TYPE.TEXT_LONG,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.RICH_TEXT,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const membersField = await createField({
    name: 'Membros',
    slug: 'membros',
    type: E_FIELD_TYPE.USER,
    required: false,
    multiple: true,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  await createField({
    name: 'Membros notificados',
    slug: 'membros-notificados',
    type: E_FIELD_TYPE.TEXT_LONG,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.PLAIN_TEXT,
    showInList: false,
    showInForm: false,
    showInDetail: false,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  await createField({
    name: 'Conclusão notificada',
    slug: 'concluido-notificado',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.ALPHA_NUMERIC,
    showInList: false,
    showInForm: false,
    showInDetail: false,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const dueDateField = await createField({
    name: 'Data de vencimento',
    slug: 'data-de-vencimento',
    type: E_FIELD_TYPE.DATE,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.DD_MM_YYYY,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const startDateField = await createField({
    name: 'Data de início',
    slug: 'data-de-inicio',
    type: E_FIELD_TYPE.DATE,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.DD_MM_YYYY,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const progressField = await createField({
    name: 'Porcentagem concluída',
    slug: 'porcentagem-concluida',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.DECIMAL,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const listField = await createField({
    name: 'Lista',
    slug: 'lista',
    type: E_FIELD_TYPE.DROPDOWN,
    required: true,
    multiple: false,
    format: null,
    showInList: true,
    showInForm: true,
    showInDetail: true,
    showInFilter: true,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [
      { id: 'todo', label: 'A Fazer', color: '#ef4444' },
      { id: 'doing', label: 'Fazendo', color: '#f59e0b' },
      { id: 'done', label: 'Feito', color: '#22c55e' },
    ],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const attachmentsGroupSlug = 'anexos';
  const tasksGroupSlug = 'tarefas';
  const commentsGroupSlug = 'comentarios';

  const attachmentFileField = await fieldRepository.create({
    name: 'Arquivos',
    slug: 'arquivos',
    type: E_FIELD_TYPE.FILE,
    required: false,
    multiple: true,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const taskTitleField = await fieldRepository.create({
    name: 'Título',
    slug: 'titulo',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: true,
    multiple: false,
    format: E_FIELD_FORMAT.ALPHA_NUMERIC,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const taskDoneField = await fieldRepository.create({
    name: 'Realizado',
    slug: 'realizado',
    type: E_FIELD_TYPE.DROPDOWN,
    required: false,
    multiple: false,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [
      { id: 'sim', label: 'Sim', color: '#22c55e' },
      { id: 'nao', label: 'Não', color: '#ef4444' },
    ],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const commentTextField = await fieldRepository.create({
    name: 'Comentário',
    slug: 'comentario',
    type: E_FIELD_TYPE.TEXT_LONG,
    required: true,
    multiple: false,
    format: E_FIELD_FORMAT.PLAIN_TEXT,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const commentAuthorField = await fieldRepository.create({
    name: 'Autor',
    slug: 'autor',
    type: E_FIELD_TYPE.USER,
    required: false,
    multiple: false,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const commentDateField = await fieldRepository.create({
    name: 'Data',
    slug: 'data',
    type: E_FIELD_TYPE.DATE,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.DD_MM_YYYY_HH_MM_SS,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const attachmentAuthorField = await fieldRepository.create({
    name: 'Autor',
    slug: 'autor',
    type: E_FIELD_TYPE.USER,
    required: false,
    multiple: false,
    format: null,
    showInList: false,
    showInForm: false,
    showInDetail: false,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const attachmentDateField = await fieldRepository.create({
    name: 'Data',
    slug: 'data',
    type: E_FIELD_TYPE.DATE,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.DD_MM_YYYY_HH_MM_SS,
    showInList: false,
    showInForm: false,
    showInDetail: false,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const attachmentsGroup: IGroupConfiguration = {
    slug: attachmentsGroupSlug,
    name: 'Anexos',
    fields: [attachmentFileField, attachmentAuthorField, attachmentDateField],
    _schema: buildSchema([
      attachmentFileField,
      attachmentAuthorField,
      attachmentDateField,
    ]),
  };

  const tasksGroup: IGroupConfiguration = {
    slug: tasksGroupSlug,
    name: 'Tarefas',
    fields: [taskTitleField, taskDoneField],
    _schema: buildSchema([taskTitleField, taskDoneField]),
  };

  const commentsGroup: IGroupConfiguration = {
    slug: commentsGroupSlug,
    name: 'Comentários',
    fields: [commentTextField, commentAuthorField, commentDateField],
    _schema: buildSchema([
      commentTextField,
      commentAuthorField,
      commentDateField,
    ]),
  };

  const attachmentsGroupField = await createField({
    name: 'Anexos',
    slug: attachmentsGroupSlug,
    type: E_FIELD_TYPE.FIELD_GROUP,
    required: false,
    multiple: true,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: { slug: attachmentsGroupSlug },
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const tasksGroupField = await createField({
    name: 'Tarefas',
    slug: tasksGroupSlug,
    type: E_FIELD_TYPE.FIELD_GROUP,
    required: false,
    multiple: true,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: { slug: tasksGroupSlug },
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const commentsGroupField = await createField({
    name: 'Comentários',
    slug: commentsGroupSlug,
    type: E_FIELD_TYPE.FIELD_GROUP,
    required: false,
    multiple: true,
    format: null,
    showInList: false,
    showInForm: true,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: { slug: commentsGroupSlug },
    widthInForm: null,
    widthInList: null,
    widthInDetail: null,
  });

  const groups = [attachmentsGroup, tasksGroup, commentsGroup];

  const orderList = [
    titleField._id,
    listField._id,
    progressField._id,
    startDateField._id,
    dueDateField._id,
    membersField._id,
    attachmentsGroupField._id,
    tasksGroupField._id,
    commentsGroupField._id,
    descriptionField._id,
  ];

  const orderForm = [
    titleField._id,
    descriptionField._id,
    listField._id,
    membersField._id,
    startDateField._id,
    dueDateField._id,
    progressField._id,
    attachmentsGroupField._id,
    tasksGroupField._id,
    commentsGroupField._id,
  ];

  const orderFilter = [
    titleField._id,
    listField._id,
    membersField._id,
    startDateField._id,
    dueDateField._id,
  ];

  const orderDetail = orderForm;

  return {
    fields: createdFields,
    groups,
    orderList,
    orderForm,
    orderFilter,
    orderDetail,
  };
}
