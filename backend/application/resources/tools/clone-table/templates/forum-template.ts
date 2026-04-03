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
import { buildSchema, buildTable } from '@application/core/util.core';
import type { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import type { TableCreatePayload } from '@application/repositories/table/table-contract.repository';

import type {
  CloneTableDeps,
  CloneTableResponse,
  CloneTableUseCasePayload,
} from '../clone-table.types';

export async function createForumTemplate(
  payload: CloneTableUseCasePayload,
  deps: CloneTableDeps,
): Promise<CloneTableResponse> {
  const newSlug = slugify(payload.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  const { fields, groups, orderList, orderForm, orderFilter, orderDetail } = await buildForumFields(
    deps.fieldRepository,
  );
  const nativeFields = await deps.fieldRepository.createMany(FIELD_NATIVE_LIST);
  const nativeFieldIds = nativeFields.map((field) => field._id);

  const _schema = buildSchema([...nativeFields, ...fields], groups);

  const createPayload: TableCreatePayload = {
    _schema,
    name: payload.name,
    slug: newSlug,
    description: 'Forum com canais e mensagens',
    type: E_TABLE_TYPE.TABLE,
    logo: null,
    fields: [...nativeFieldIds, ...fields.map((f) => f._id)],
    style: E_TABLE_STYLE.FORUM,
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
  const messages = field.get('mensagens');
  if (!Array.isArray(messages) || messages.length === 0) return;

  const nextMessages = await Promise.all(
    messages.map(async (message) => {
      if (!message || typeof message !== 'object') return message;

      const mentionEmails = Array.isArray(message['mencoes-emails'])
        ? message['mencoes-emails']
            .map((item) => String(item || '').trim().toLowerCase())
            .filter(Boolean)
        : (() => {
            const raw = typeof message['mencoes-emails'] === 'string'
              ? message['mencoes-emails'].trim()
              : '';
            if (!raw) return [];
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed)
                ? parsed
                    .map((item) => String(item || '').trim().toLowerCase())
                    .filter(Boolean)
                : [];
            } catch {
              return [];
            }
          })();

      const alreadyNotified = Array.isArray(message['mencoes-notificadas'])
        ? message['mencoes-notificadas']
            .map((item) => String(item || '').trim().toLowerCase())
            .filter(Boolean)
        : (() => {
            const raw = typeof message['mencoes-notificadas'] === 'string'
              ? message['mencoes-notificadas'].trim()
              : '';
            if (!raw) return [];
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed)
                ? parsed
                    .map((item) => String(item || '').trim().toLowerCase())
                    .filter(Boolean)
                : [];
            } catch {
              return [];
            }
          })();

      const notifiedSet = new Set(alreadyNotified);
      const newRecipients = mentionEmails.filter((email) => !notifiedSet.has(email));

      if (newRecipients.length > 0) {
        await email.send(
          newRecipients,
          'Você foi mencionado em um canal',
          'Você recebeu uma menção em uma mensagem do fórum.'
        );
      }

      return {
        ...message,
        'mencoes-notificadas': JSON.stringify(
          Array.from(new Set([...alreadyNotified, ...newRecipients]))
        ),
      };
    })
  );

  field.set('mensagens', nextMessages);
})();
        `.trim(),
      },
      afterSave: { code: null },
    },
    groups,
  };

  const newTable = await deps.tableRepository.create(createPayload);

  const channelField = fields.find((field) => field.slug === 'canal');
  const descriptionField = fields.find((field) => field.slug === 'descricao');
  const privacyField = fields.find((field) => field.slug === 'privacidade');
  const membersField = fields.find((field) => field.slug === 'membros');
  if (channelField) {
    const model = await buildTable(newTable);
    await model.create({
      [channelField.slug]: 'Bem-vindos',
      ...(descriptionField && {
        [descriptionField.slug]: 'Canal inicial',
      }),
      ...(privacyField && {
        [privacyField.slug]: 'publico',
      }),
      ...(membersField && {
        [membersField.slug]: [],
      }),
      creator: payload.ownerId,
    });
  }

  return right({
    table: newTable,
    fieldIdMap: {},
  });
}

export async function buildForumFields(
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

  const channelField = await createField({
    name: 'Canal',
    slug: 'canal',
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
    widthInForm: 50,
    widthInList: 50,
    widthInDetail: null,
  });

  const channelDescriptionField = await createField({
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
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: null,
    widthInForm: 100,
    widthInList: 100,
    widthInDetail: null,
  });

  const channelPrivacyField = await createField({
    name: 'Privacidade',
    slug: 'privacidade',
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
      { id: 'publico', label: 'Público', color: '#22c55e' },
      { id: 'privado', label: 'Privado', color: '#ef4444' },
    ],
    category: [],
    group: null,
    widthInForm: 50,
    widthInList: 50,
    widthInDetail: null,
  });

  const channelMembersField = await createField({
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
    widthInForm: 100,
    widthInList: 100,
    widthInDetail: null,
  });

  const messagesGroupSlug = 'mensagens';

  const messageIdField = await fieldRepository.create({
    name: 'ID',
    slug: 'mensagem-id',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: true,
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

  const messageTextField = await fieldRepository.create({
    name: 'Texto',
    slug: 'texto',
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

  const messageAuthorField = await fieldRepository.create({
    name: 'Autor',
    slug: 'autor',
    type: E_FIELD_TYPE.USER,
    required: true,
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

  const messageDateField = await fieldRepository.create({
    name: 'Data',
    slug: 'data',
    type: E_FIELD_TYPE.DATE,
    required: true,
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

  const messageAttachmentsField = await fieldRepository.create({
    name: 'Anexos',
    slug: 'anexos',
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

  const messageMentionsField = await fieldRepository.create({
    name: 'Menções',
    slug: 'mencoes',
    type: E_FIELD_TYPE.USER,
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

  const messageMentionEmailsField = await fieldRepository.create({
    name: 'Menções (emails)',
    slug: 'mencoes-emails',
    type: E_FIELD_TYPE.TEXT_LONG,
    required: false,
    multiple: true,
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

  const messageMentionNotifiedField = await fieldRepository.create({
    name: 'Menções notificadas',
    slug: 'mencoes-notificadas',
    type: E_FIELD_TYPE.TEXT_LONG,
    required: false,
    multiple: true,
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

  const messageMentionSeenField = await fieldRepository.create({
    name: 'Menções visualizadas',
    slug: 'mencoes-visualizadas',
    type: E_FIELD_TYPE.USER,
    required: false,
    multiple: true,
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

  const messageReplyField = await fieldRepository.create({
    name: 'Resposta',
    slug: 'resposta',
    type: E_FIELD_TYPE.TEXT_SHORT,
    required: false,
    multiple: false,
    format: E_FIELD_FORMAT.ALPHA_NUMERIC,
    showInList: false,
    showInForm: false,
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

  const messageReactionsField = await fieldRepository.create({
    name: 'Reações',
    slug: 'reacoes',
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

  const messagesGroup: IGroupConfiguration = {
    slug: messagesGroupSlug,
    name: 'Mensagens',
    fields: [
      messageIdField,
      messageTextField,
      messageAuthorField,
      messageDateField,
      messageAttachmentsField,
      messageMentionsField,
      messageMentionEmailsField,
      messageMentionNotifiedField,
      messageMentionSeenField,
      messageReplyField,
      messageReactionsField,
    ],
    _schema: buildSchema([
      messageIdField,
      messageTextField,
      messageAuthorField,
      messageDateField,
      messageAttachmentsField,
      messageMentionsField,
      messageMentionEmailsField,
      messageMentionNotifiedField,
      messageMentionSeenField,
      messageReplyField,
      messageReactionsField,
    ]),
  };

  const messagesGroupField = await createField({
    name: 'Mensagens',
    slug: messagesGroupSlug,
    type: E_FIELD_TYPE.FIELD_GROUP,
    required: false,
    multiple: true,
    format: null,
    showInList: false,
    showInForm: false,
    showInDetail: true,
    showInFilter: false,
    defaultValue: null,
    locked: true,
    relationship: null,
    dropdown: [],
    category: [],
    group: { slug: messagesGroupSlug },
    widthInForm: 100,
    widthInList: 100,
    widthInDetail: null,
  });

  const groups = [messagesGroup];

  const orderList = [
    channelField._id,
    channelDescriptionField._id,
    channelPrivacyField._id,
    channelMembersField._id,
    messagesGroupField._id,
  ];
  const orderForm = [
    channelField._id,
    channelDescriptionField._id,
    channelPrivacyField._id,
    channelMembersField._id,
    messagesGroupField._id,
  ];

  const orderFilter = [
    channelField._id,
    channelPrivacyField._id,
    channelMembersField._id,
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
