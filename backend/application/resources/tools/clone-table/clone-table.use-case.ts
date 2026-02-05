/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
  type IField,
  type IGroupConfiguration,
  type ITable,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import {
  TableContractRepository,
  TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';

import type { CloneTablePayload } from './clone-table.validator';

export type CloneTableUseCasePayload = CloneTablePayload & {
  ownerId: string;
};

type Response = Either<
  HTTPException,
  {
    table: ITable;
    fieldIdMap: Record<string, string>;
  }
>;

const KANBAN_TEMPLATE_ID = 'KANBAN_TEMPLATE';
const CARDS_TEMPLATE_ID = 'CARDS_TEMPLATE';
const MOSAIC_TEMPLATE_ID = 'MOSAIC_TEMPLATE';
const DOCUMENT_TEMPLATE_ID = 'DOCUMENT_TEMPLATE';

@Service()
export default class CloneTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(payload: CloneTableUseCasePayload): Promise<Response> {
    try {
      if (!payload.ownerId) {
        return left(
          HTTPException.BadRequest(
            'Owner ID é obrigatório',
            'OWNER_ID_REQUIRED',
          ),
        );
      }

      if (payload.baseTableId === KANBAN_TEMPLATE_ID) {
        return await this.createKanbanTemplate(payload);
      }

      if (payload.baseTableId === CARDS_TEMPLATE_ID) {
        return await this.createCardsTemplate(payload);
      }

      if (payload.baseTableId === MOSAIC_TEMPLATE_ID) {
        return await this.createMosaicTemplate(payload);
      }

      if (payload.baseTableId === DOCUMENT_TEMPLATE_ID) {
        return await this.createDocumentTemplate(payload);
      }

      const baseTable = await this.tableRepository.findBy({
        _id: payload.baseTableId,
        exact: true,
      });

      if (!baseTable) {
        return left(
          HTTPException.NotFound(
            'Tabela base não encontrada',
            'TABLE_NOT_FOUND',
          ),
        );
      }

      const newSlug = slugify(payload.name, {
        lower: true,
        strict: true,
        trim: true,
      });

      const { newFieldIds, fieldIdMap, clonedFields } = await this.cloneFields(
        baseTable.fields,
      );

      const _schema = buildSchema(clonedFields);

      const orderList = this.remapFieldIds(
        baseTable.fieldOrderList,
        fieldIdMap,
      );

      const orderForm = this.remapFieldIds(
        baseTable.fieldOrderForm,
        fieldIdMap,
      );

      const createPayload: TableCreatePayload = {
        _schema,
        name: payload.name,
        slug: newSlug,
        description: baseTable.description ?? null,
        type: baseTable.type,
        logo: baseTable.logo?._id ?? null,
        fields: newFieldIds,
        style: baseTable.style,
        visibility: baseTable.visibility,
        collaboration: baseTable.collaboration,
        administrators: baseTable.administrators.flatMap((a) => a._id),
        owner: payload.ownerId,
        fieldOrderList: orderList,
        fieldOrderForm: orderForm,
        methods: baseTable.methods,
      };

      const newTable = await this.tableRepository.create(createPayload);

      return right({
        table: newTable,
        fieldIdMap,
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Erro ao clonar tabela',
          'CLONE_TABLE_ERROR',
        ),
      );
    }
  }

  private async createKanbanTemplate(
    payload: CloneTableUseCasePayload,
  ): Promise<Response> {
    const newSlug = slugify(payload.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const { fields, groups, orderList, orderForm } =
      await this.buildKanbanFields();

    const _schema = buildSchema(fields, groups);

    const createPayload: TableCreatePayload = {
      _schema,
      name: payload.name,
      slug: newSlug,
      description: 'Kanban de tarefas',
      type: E_TABLE_TYPE.TABLE,
      logo: null,
      fields: fields.map((f) => f._id),
      style: E_TABLE_STYLE.KANBAN,
      visibility: E_TABLE_VISIBILITY.RESTRICTED,
      collaboration: E_TABLE_COLLABORATION.RESTRICTED,
      administrators: [],
      owner: payload.ownerId,
      fieldOrderList: orderList,
      fieldOrderForm: orderForm,
      methods: {
        onLoad: { code: null },
        beforeSave: {
          code: `
const membros = getFieldValue('membros') || [];
const emails = Array.isArray(membros)
  ? membros
      .map((m) => {
        if (m && typeof m === 'object') return m.email || null;
        if (typeof m === 'string' && m.includes('@')) return m;
        return null;
      })
      .filter(Boolean)
  : [];

const prevRaw = getFieldValue('membros-notificados') || '[]';
let prev = [];
try {
  prev = Array.isArray(prevRaw) ? prevRaw : JSON.parse(prevRaw);
} catch (e) {
  prev = [];
}
const prevSet = new Set(prev.filter(Boolean));
const newEmails = emails.filter((e) => !prevSet.has(e));
if (newEmails.length > 0) {
  sendEmail(
    newEmails,
    'Você foi adicionado a uma tarefa',
    'Você foi adicionado como membro em uma tarefa do kanban.'
  );
  setFieldValue(
    'membros-notificados',
    JSON.stringify([...prevSet, ...newEmails])
  );
}

const progresso = Number(getFieldValue('porcentagem-concluida') || 0);
const notificado = getFieldValue('concluido-notificado') === 'true';
if (progresso >= 100 && !notificado) {
  if (emails.length > 0) {
    sendEmail(
      emails,
      'Tarefa concluída',
      'A tarefa foi concluída (100%).'
    );
  }
  setFieldValue('concluido-notificado', 'true');
}
if (progresso < 100 && notificado) {
  setFieldValue('concluido-notificado', 'false');
}
          `.trim(),
        },
        afterSave: { code: null },
      },
      groups,
    };

    const newTable = await this.tableRepository.create(createPayload);

    return right({
      table: newTable,
      fieldIdMap: {},
    });
  }

  private async createCardsTemplate(
    payload: CloneTableUseCasePayload,
  ): Promise<Response> {
    const newSlug = slugify(payload.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const { fields, orderList, orderForm } = await this.buildCardsFields();

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

    const newTable = await this.tableRepository.create(createPayload);

    return right({
      table: newTable,
      fieldIdMap: {},
    });
  }

  private async buildSimpleMediaFields(): Promise<{
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
      const field = await this.fieldRepository.create({
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
      widthInList: 50,
    });

    const imageField = await createField({
      name: 'Imagem',
      slug: 'imagem',
      type: E_FIELD_TYPE.FILE,
      required: false,
      multiple: false,
      format: null,
      showInList: true,
      showInForm: true,
      showInDetail: true,
      showInFilter: false,
      defaultValue: null,
      locked: false,
      relationship: null,
      dropdown: [],
      category: [],
      group: null,
      widthInForm: 50,
      widthInList: 50,
    });

    const orderList = [imageField._id, titleField._id, descriptionField._id];

    const orderForm = [titleField._id, descriptionField._id, imageField._id];

    return {
      fields: createdFields,
      orderList,
      orderForm,
    };
  }

  private async buildCardsFields(): Promise<{
    fields: IField[];
    orderList: string[];
    orderForm: string[];
  }> {
    const base = await this.buildSimpleMediaFields();
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
      const field = await this.fieldRepository.create({
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

  private async createMosaicTemplate(
    payload: CloneTableUseCasePayload,
  ): Promise<Response> {
    const newSlug = slugify(payload.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const { fields, orderList, orderForm } = await this.buildMosaicFields();

    const _schema = buildSchema(fields);

    const createPayload: TableCreatePayload = {
      _schema,
      name: payload.name,
      slug: newSlug,
      description: 'Mosaico',
      type: E_TABLE_TYPE.TABLE,
      logo: null,
      fields: fields.map((f) => f._id),
      style: E_TABLE_STYLE.MOSAIC,
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

    const newTable = await this.tableRepository.create(createPayload);

    return right({
      table: newTable,
      fieldIdMap: {},
    });
  }

  private async buildMosaicFields(): Promise<{
    fields: IField[];
    orderList: string[];
    orderForm: string[];
  }> {
    return await this.buildSimpleMediaFields();
  }

  private async createDocumentTemplate(
    payload: CloneTableUseCasePayload,
  ): Promise<Response> {
    const newSlug = slugify(payload.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const { fields, orderList, orderForm } = await this.buildDocumentFields();

    const _schema = buildSchema(fields);

    const createPayload: TableCreatePayload = {
      _schema,
      name: payload.name,
      slug: newSlug,
      description: 'Documento',
      type: E_TABLE_TYPE.TABLE,
      logo: null,
      fields: fields.map((f) => f._id),
      style: E_TABLE_STYLE.DOCUMENT,
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

    const newTable = await this.tableRepository.create(createPayload);

    return right({
      table: newTable,
      fieldIdMap: {},
    });
  }

  private async buildDocumentFields(): Promise<{
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
      const field = await this.fieldRepository.create({
        ...payload,
      });
      createdFields.push(field);
      return field;
    };

    const indexField = await createField({
      name: 'Indice',
      slug: 'indice',
      type: E_FIELD_TYPE.CATEGORY,
      required: true,
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

    const textField = await createField({
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
      locked: false,
      relationship: null,
      dropdown: [],
      category: [],
      group: null,
      widthInForm: 100,
      widthInList: 100,
    });

    const orderList = [indexField._id, titleField._id, textField._id];

    const orderForm = [titleField._id, indexField._id, textField._id];

    return {
      fields: createdFields,
      orderList,
      orderForm,
    };
  }

  private async buildKanbanFields(): Promise<{
    fields: IField[];
    groups: IGroupConfiguration[];
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
      const field = await this.fieldRepository.create({
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
    });

    const membersNotifiedField = await createField({
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
    });

    const completedNotifiedField = await createField({
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
    });

    const attachmentField = await createField({
      name: 'Anexo',
      slug: 'anexo',
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
    });

    const labelsField = await createField({
      name: 'Etiquetas',
      slug: 'etiquetas',
      type: E_FIELD_TYPE.DROPDOWN,
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
    });

    const tasksGroupSlug = 'tarefas';
    const commentsGroupSlug = 'comentarios';

    const taskTitleField = await this.fieldRepository.create({
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
    });

    const taskDoneField = await this.fieldRepository.create({
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
    });

    const commentTextField = await this.fieldRepository.create({
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
    });

    const commentAuthorField = await this.fieldRepository.create({
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
    });

    const commentDateField = await this.fieldRepository.create({
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
    });

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
    });

    const groups = [tasksGroup, commentsGroup];

    const orderList = [
      titleField._id,
      listField._id,
      progressField._id,
      dueDateField._id,
      membersField._id,
      labelsField._id,
      attachmentField._id,
      tasksGroupField._id,
      commentsGroupField._id,
      descriptionField._id,
    ];

    const orderForm = [
      titleField._id,
      descriptionField._id,
      listField._id,
      labelsField._id,
      membersField._id,
      dueDateField._id,
      progressField._id,
      attachmentField._id,
      tasksGroupField._id,
      commentsGroupField._id,
    ];

    return {
      fields: createdFields,
      groups,
      orderList,
      orderForm,
    };
  }

  private async cloneFields(fields: IField[]): Promise<{
    newFieldIds: string[];
    fieldIdMap: Record<string, string>;
    clonedFields: IField[];
  }> {
    const newFieldIds: string[] = [];
    const fieldIdMap: Record<string, string> = {};
    const clonedFields: IField[] = [];

    if (!fields || !Array.isArray(fields)) {
      return { newFieldIds, fieldIdMap, clonedFields };
    }

    for (const field of fields) {
      const createdField = await this.fieldRepository.create({
        name: field.name,
        slug: field.slug,
        type: field.type,
        required: field.required,
        multiple: field.multiple,
        format: field.format,
        showInList: field.showInList,
        showInForm: field.showInForm,
        showInDetail: field.showInDetail,
        showInFilter: field.showInFilter,
        defaultValue: field.defaultValue,
        locked: field.locked,
        relationship: field.relationship,
        dropdown: field.dropdown,
        category: field.category,
        group: field.group,
        widthInForm: field.widthInForm,
        widthInList: field.widthInList,
      });

      newFieldIds.push(createdField._id);
      fieldIdMap[field._id] = createdField._id;
      clonedFields.push(createdField);
    }

    return { newFieldIds, fieldIdMap, clonedFields };
  }

  private remapFieldIds(
    ids: string[] | undefined,
    map: Record<string, string>,
  ): string[] {
    if (!Array.isArray(ids)) return [];

    return ids.map((id) => map[id]).filter(Boolean);
  }
}
