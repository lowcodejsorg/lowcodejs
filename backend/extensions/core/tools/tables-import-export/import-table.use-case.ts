/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  E_MENU_ITEM_TYPE,
  FIELD_GROUP_NATIVE_LIST,
  FIELD_NATIVE_LIST,
  type IField,
  type IGroupConfiguration,
  type ILayoutFields,
  type ITable,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import {
  TableContractRepository,
  type TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';
import { TableSchemaContractService } from '@application/services/table-schema/table-schema-contract.service';

import type {
  ImportedTableSummary,
  ImportTableResponse,
  ImportTableUseCasePayload,
} from './import-table.types';

type ExportedField = {
  name: string;
  slug: string;
  type: string;
  required: boolean;
  multiple: boolean;
  format: string | null;
  showInFilter: boolean;
  showInForm: boolean;
  showInDetail: boolean;
  showInList: boolean;
  widthInForm: number | null;
  widthInList: number | null;
  widthInDetail: number | null;
  defaultValue: string | string[] | null;
  locked?: boolean;
  relationship: {
    tableSlug: string;
    fieldSlug: string;
    order: 'asc' | 'desc';
  } | null;
  dropdown: Array<{ id: string; label: string; color?: string | null }>;
  category: Array<{ id: string; label: string; children: unknown[] }>;
  group: { slug: string } | null;
};

type ExportedGroup = {
  slug: string;
  name: string;
  fields: ExportedField[];
};

type ExportedStructure = {
  name: string;
  slug: string;
  description: string | null;
  style: string;
  visibility: string;
  collaboration: string;
  fields: ExportedField[];
  groups: ExportedGroup[];
  fieldOrderList: string[];
  fieldOrderForm: string[];
  fieldOrderFilter: string[];
  fieldOrderDetail: string[];
  layoutFields: Record<string, string | null>;
  methods?: {
    onLoad: { code: string | null };
    beforeSave: { code: string | null };
    afterSave: { code: string | null };
  };
};

type ExportedTable = {
  structure?: ExportedStructure;
  data?: {
    totalRows: number;
    rows: Array<Record<string, unknown> & { _originalId?: string }>;
  };
};

type ExportedMenu = {
  _originalId: string;
  name: string;
  slug: string;
  type: string;
  parent: string | null;
  url: string | null;
  html: string | null;
  order: number;
  isInitial: boolean;
  tableSlug: string | null;
  extension: { pkg: string; extensionId: string } | null;
};

type NormalizedPackage = {
  tables: ExportedTable[];
  menus: ExportedMenu[];
};

const REFERENCE_TYPES = new Set<string>([
  E_FIELD_TYPE.FILE,
  E_FIELD_TYPE.USER,
  E_FIELD_TYPE.EVALUATION,
  E_FIELD_TYPE.REACTION,
  E_FIELD_TYPE.CREATOR,
]);

@Service()
export default class ImportTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly rowRepository: RowContractRepository,
    private readonly menuRepository: MenuContractRepository,
    private readonly tableSchemaService: TableSchemaContractService,
  ) {}

  async execute(
    payload: ImportTableUseCasePayload,
  ): Promise<ImportTableResponse> {
    try {
      if (!payload.ownerId) {
        return left(
          HTTPException.BadRequest(
            'Owner ID é obrigatório',
            'OWNER_ID_REQUIRED',
          ),
        );
      }

      const content = payload.fileContent as Record<string, unknown>;
      const header = content.header as Record<string, unknown> | undefined;

      if (!header || header.platform !== 'lowcodejs') {
        return left(
          HTTPException.BadRequest(
            'Arquivo de importação inválido. Plataforma não reconhecida.',
            'INVALID_PLATFORM',
          ),
        );
      }

      const pkg = this.normalizePackage(content);
      if (pkg.tables.length === 0 || !pkg.tables[0].structure) {
        return left(
          HTTPException.BadRequest(
            'Importação requer ao menos uma tabela com estrutura',
            'STRUCTURE_REQUIRED',
          ),
        );
      }

      const renameFirst = this.computeFirstRename(payload, pkg);

      const conflict = await this.detectConflicts(pkg, renameFirst);
      if (conflict) return left(conflict);

      const tableSlugToInfo = new Map<
        string,
        {
          originalSlug: string;
          newSlug: string;
          newName: string;
          tableId?: string;
          fieldSlugToId?: Map<string, string>;
          fieldsIds?: string[];
          allFields?: IField[];
          groups?: IGroupConfiguration[];
          structure: ExportedStructure;
        }
      >();

      for (const [index, t] of pkg.tables.entries()) {
        if (!t.structure) continue;
        const originalSlug = t.structure.slug;
        const isFirst = index === 0;
        const newName =
          isFirst && renameFirst ? renameFirst.name : t.structure.name;
        const newSlug =
          isFirst && renameFirst ? renameFirst.slug : originalSlug;
        tableSlugToInfo.set(originalSlug, {
          originalSlug,
          newSlug,
          newName,
          structure: t.structure,
        });
      }

      // Phase A: create tables (relationship pointing to packages → resolved later)
      for (const info of tableSlugToInfo.values()) {
        const built = await this.createTableSkeleton({
          structure: info.structure,
          newName: info.newName,
          newSlug: info.newSlug,
          ownerId: payload.ownerId,
          packageSlugs: new Set(tableSlugToInfo.keys()),
        });
        info.tableId = built.tableId;
        info.fieldSlugToId = built.fieldSlugToId;
        info.fieldsIds = built.fieldsIds;
        info.allFields = built.allFields;
        info.groups = built.groups;
      }

      // Phase B: resolve relationships within the package (rewrite to new ids/slugs)
      for (const info of tableSlugToInfo.values()) {
        await this.resolvePackageRelationships(info, tableSlugToInfo);
      }

      // Phase C: insert rows (without relationship fields) + collect id map
      const rowIdMap = new Map<string, Map<string, string>>(); // originalSlug → originalRowId → newRowId
      const fullTables = new Map<string, ITable>();
      let importedRowCount = 0;

      for (const info of tableSlugToInfo.values()) {
        const full = await this.tableRepository.findById(info.tableId!);
        if (!full) continue;
        fullTables.set(info.originalSlug, full);
        const entry = pkg.tables.find(
          (t) => t.structure?.slug === info.originalSlug,
        );
        if (!entry?.data?.rows?.length) {
          rowIdMap.set(info.originalSlug, new Map());
          continue;
        }
        const map = new Map<string, string>();
        for (const row of entry.data.rows) {
          const stripped = this.stripRelationshipFields(row, full);
          try {
            const inserted = await this.rowRepository.insertRaw(
              full,
              stripped,
              payload.ownerId,
            );
            importedRowCount++;
            const originalRowId = row._originalId
              ? String(row._originalId)
              : null;
            if (originalRowId) map.set(originalRowId, inserted._id);
          } catch (rowError) {
            console.error('[tools > import-table][row-insert]:', rowError);
          }
        }
        rowIdMap.set(info.originalSlug, map);
      }

      // Phase D: backfill relationships using the row id map
      for (const info of tableSlugToInfo.values()) {
        const full = fullTables.get(info.originalSlug);
        if (!full) continue;
        const entry = pkg.tables.find(
          (t) => t.structure?.slug === info.originalSlug,
        );
        if (!entry?.data?.rows?.length) continue;
        await this.backfillRelationships({
          table: full,
          rows: entry.data.rows,
          rowIdMap,
          ownerSlug: info.originalSlug,
        });
      }

      // Phase E: recreate menus
      const importedMenus = await this.importMenus({
        menus: pkg.menus,
        tableSlugToInfo,
        ownerId: payload.ownerId,
      });

      const summaries: ImportedTableSummary[] = Array.from(
        tableSlugToInfo.values(),
      ).map((info) => ({
        tableId: info.tableId!,
        slug: info.newSlug,
        name: info.newName,
      }));

      const first = summaries[0];
      const importedFields = Array.from(tableSlugToInfo.values()).reduce(
        (acc, info) => acc + (info.allFields?.filter((f) => !f.native).length || 0),
        0,
      );

      return right({
        tableId: first.tableId,
        slug: first.slug,
        importedFields,
        importedRows: importedRowCount,
        tables: summaries,
        importedMenus,
      });
    } catch (error) {
      console.error('[tools > import-table][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'IMPORT_TABLE_ERROR',
        ),
      );
    }
  }

  // ── Normalization ──────────────────────────────────────────

  private normalizePackage(content: Record<string, unknown>): NormalizedPackage {
    if (Array.isArray(content.tables)) {
      return {
        tables: content.tables as ExportedTable[],
        menus: Array.isArray(content.menus)
          ? (content.menus as ExportedMenu[])
          : [],
      };
    }
    const legacyStructure = content.structure as ExportedStructure | undefined;
    const legacyData = content.data as ExportedTable['data'];
    if (legacyStructure) {
      return {
        tables: [{ structure: legacyStructure, data: legacyData }],
        menus: [],
      };
    }
    return { tables: [], menus: [] };
  }

  private computeFirstRename(
    payload: ImportTableUseCasePayload,
    pkg: NormalizedPackage,
  ): { name: string; slug: string } | null {
    if (!payload.name) return null;
    const name = payload.name.trim();
    if (!name) return null;
    if (pkg.tables.length > 1) {
      // Multi-table: rename only makes sense for single import; ignore.
      return null;
    }
    const slug = slugify(name, { lower: true, strict: true, trim: true });
    return { name, slug };
  }

  // ── Conflict detection ─────────────────────────────────────

  private async detectConflicts(
    pkg: NormalizedPackage,
    renameFirst: { name: string; slug: string } | null,
  ): Promise<HTTPException | null> {
    const conflictingTables: string[] = [];
    for (const [index, t] of pkg.tables.entries()) {
      if (!t.structure) continue;
      const slug =
        index === 0 && renameFirst ? renameFirst.slug : t.structure.slug;
      const existing = await this.tableRepository.findBySlug(slug, {
        trashed: false,
      });
      if (existing) conflictingTables.push(slug);
    }

    const conflictingMenus: string[] = [];
    for (const m of pkg.menus) {
      const existing = await this.menuRepository.findBySlug(m.slug, {
        trashed: false,
      });
      if (existing) conflictingMenus.push(m.slug);
    }

    if (conflictingTables.length === 0 && conflictingMenus.length === 0) {
      return null;
    }

    if (conflictingTables.length > 0 && conflictingMenus.length === 0) {
      // Mantém código legado para o caso single-table
      return HTTPException.BadRequest(
        'Já existe(m) tabela(s) com este(s) slug(s)',
        'TABLE_SLUG_ALREADY_EXISTS',
        { tables: conflictingTables.join(',') },
      );
    }

    return HTTPException.BadRequest(
      'Conflitos de slug impedem a importação',
      'IMPORT_CONFLICTS',
      {
        tables: conflictingTables.join(','),
        menus: conflictingMenus.join(','),
      },
    );
  }

  // ── Phase A: skeleton creation ─────────────────────────────

  private async createTableSkeleton(args: {
    structure: ExportedStructure;
    newName: string;
    newSlug: string;
    ownerId: string;
    packageSlugs: Set<string>;
  }): Promise<{
    tableId: string;
    fieldSlugToId: Map<string, string>;
    fieldsIds: string[];
    allFields: IField[];
    groups: IGroupConfiguration[];
  }> {
    const { structure, newName, newSlug, ownerId, packageSlugs } = args;

    const nativeFields = await this.fieldRepository.createMany(
      FIELD_NATIVE_LIST,
    );
    const allFields: IField[] = [...nativeFields];
    const fieldsIds: string[] = nativeFields.map((f) => f._id);
    const fieldSlugToId = new Map<string, string>();
    for (const nf of nativeFields) fieldSlugToId.set(nf.slug, nf._id);

    for (const exported of structure.fields) {
      const field = await this.createField(exported, packageSlugs);
      allFields.push(field);
      fieldsIds.push(field._id);
      fieldSlugToId.set(field.slug, field._id);
    }

    const groups: IGroupConfiguration[] = [];
    for (const group of structure.groups || []) {
      const groupFields: IField[] = [];

      const fieldGroupField = await this.fieldRepository.create({
        name: group.name,
        slug: group.slug,
        type: E_FIELD_TYPE.FIELD_GROUP,
        required: false,
        multiple: false,
        format: null,
        showInList: true,
        showInForm: true,
        showInDetail: true,
        showInFilter: false,
        widthInForm: null,
        widthInList: null,
        widthInDetail: null,
        defaultValue: null,
        relationship: null,
        dropdown: [],
        category: [],
        group: { slug: group.slug },
      });
      allFields.push(fieldGroupField);
      fieldsIds.push(fieldGroupField._id);
      fieldSlugToId.set(fieldGroupField.slug, fieldGroupField._id);

      const groupNativeList = FIELD_GROUP_NATIVE_LIST.map((f) => ({
        ...f,
        group: { slug: group.slug },
      }));
      const groupNativeFields =
        await this.fieldRepository.createMany(groupNativeList);
      for (const gnf of groupNativeFields) groupFields.push(gnf);

      for (const exported of group.fields) {
        const sub = await this.createField(
          { ...exported, group: { slug: group.slug } },
          packageSlugs,
        );
        groupFields.push(sub);
      }

      const groupSchema =
        this.tableSchemaService.computeSchema(groupFields);

      groups.push({
        slug: group.slug,
        name: group.name,
        fields: groupFields,
        _schema: groupSchema,
      });
    }

    const layoutFields: Partial<ILayoutFields> = {};
    for (const [key, slugValue] of Object.entries(structure.layoutFields || {})) {
      if (slugValue && fieldSlugToId.has(slugValue)) {
        layoutFields[key as keyof ILayoutFields] =
          fieldSlugToId.get(slugValue) || null;
      } else {
        layoutFields[key as keyof ILayoutFields] = null;
      }
    }

    const resolveOrder = (slugs: string[]): string[] =>
      (slugs || [])
        .map((s) => fieldSlugToId.get(s))
        .filter((id): id is string => Boolean(id));

    const _schema = this.tableSchemaService.computeSchema(allFields, groups);

    const createPayload: TableCreatePayload = {
      _schema,
      name: newName,
      slug: newSlug,
      description: structure.description ?? null,
      type: 'TABLE',
      logo: null,
      fields: fieldsIds,
      style: structure.style as TableCreatePayload['style'],
      visibility: structure.visibility as TableCreatePayload['visibility'],
      collaboration:
        structure.collaboration as TableCreatePayload['collaboration'],
      administrators: [],
      owner: ownerId,
      fieldOrderList: resolveOrder(structure.fieldOrderList),
      fieldOrderForm: resolveOrder(structure.fieldOrderForm),
      fieldOrderFilter: resolveOrder(structure.fieldOrderFilter),
      fieldOrderDetail: resolveOrder(structure.fieldOrderDetail),
      methods: structure.methods || {
        onLoad: { code: null },
        beforeSave: { code: null },
        afterSave: { code: null },
      },
      groups,
      layoutFields: layoutFields as ILayoutFields,
    };

    const created = await this.tableRepository.create(createPayload);

    return {
      tableId: created._id,
      fieldSlugToId,
      fieldsIds,
      allFields,
      groups,
    };
  }

  /**
   * Cria um field. Quando `relationship` aponta para uma tabela DENTRO do
   * pacote sendo importado, o relationship é deixado como null (resolvido na
   * fase B). Para tabelas FORA do pacote, tenta resolver contra o DB.
   */
  private async createField(
    exported: ExportedField,
    packageSlugs: Set<string>,
  ): Promise<IField> {
    let relationship: IField['relationship'] = null;

    if (
      exported.type === E_FIELD_TYPE.RELATIONSHIP &&
      exported.relationship &&
      !packageSlugs.has(exported.relationship.tableSlug)
    ) {
      const relatedTable = await this.tableRepository.findBySlug(
        exported.relationship.tableSlug,
      );
      if (relatedTable) {
        const relatedField = relatedTable.fields.find(
          (f) => f.slug === exported.relationship!.fieldSlug,
        );
        if (relatedField) {
          relationship = {
            table: { _id: relatedTable._id, slug: relatedTable.slug },
            field: { _id: relatedField._id, slug: relatedField.slug },
            order: exported.relationship.order,
          };
        }
      }
    }

    return this.fieldRepository.create({
      name: exported.name,
      slug: exported.slug,
      type: exported.type as IField['type'],
      required: exported.required,
      multiple: exported.multiple,
      format: exported.format as IField['format'],
      showInList: exported.showInList,
      showInForm: exported.showInForm,
      showInDetail: exported.showInDetail,
      showInFilter: exported.showInFilter,
      widthInForm: exported.widthInForm,
      widthInList: exported.widthInList,
      widthInDetail: exported.widthInDetail,
      defaultValue: exported.defaultValue,
      locked: exported.locked,
      relationship,
      dropdown: exported.dropdown,
      category: exported.category as IField['category'],
      group: exported.group,
    });
  }

  // ── Phase B: resolve in-package relationships ──────────────

  private async resolvePackageRelationships(
    info: {
      structure: ExportedStructure;
      newSlug: string;
      fieldSlugToId?: Map<string, string>;
      tableId?: string;
      allFields?: IField[];
      groups?: IGroupConfiguration[];
    },
    tableSlugToInfo: Map<
      string,
      {
        newSlug: string;
        tableId?: string;
        fieldSlugToId?: Map<string, string>;
      }
    >,
  ): Promise<void> {
    if (!info.tableId || !info.allFields || !info.fieldSlugToId) return;

    const resolveOne = async (
      exported: ExportedField,
      currentFieldId: string,
    ): Promise<IField | null> => {
      if (
        exported.type !== E_FIELD_TYPE.RELATIONSHIP ||
        !exported.relationship
      ) {
        return null;
      }
      const ref = tableSlugToInfo.get(exported.relationship.tableSlug);
      if (!ref?.tableId || !ref.fieldSlugToId) return null;
      const targetFieldId = ref.fieldSlugToId.get(exported.relationship.fieldSlug);
      if (!targetFieldId) return null;
      return this.fieldRepository.update({
        _id: currentFieldId,
        relationship: {
          table: { _id: ref.tableId, slug: ref.newSlug },
          field: { _id: targetFieldId, slug: exported.relationship.fieldSlug },
          order: exported.relationship.order,
        },
      });
    };

    let touched = false;
    const updatedAllFields = [...info.allFields];

    for (const exported of info.structure.fields) {
      const id = info.fieldSlugToId.get(exported.slug);
      if (!id) continue;
      const updated = await resolveOne(exported, id);
      if (updated) {
        touched = true;
        const idx = updatedAllFields.findIndex((f) => f._id === id);
        if (idx >= 0) updatedAllFields[idx] = updated;
      }
    }

    const updatedGroups = info.groups ? [...info.groups] : [];
    for (const [gi, group] of (info.structure.groups || []).entries()) {
      const gconf = updatedGroups[gi];
      if (!gconf) continue;
      const newGroupFields = [...gconf.fields];
      for (const exported of group.fields) {
        const idInGroup = newGroupFields.find((f) => f.slug === exported.slug);
        if (!idInGroup) continue;
        const updated = await resolveOne(exported, idInGroup._id);
        if (updated) {
          touched = true;
          const idx = newGroupFields.findIndex((f) => f._id === idInGroup._id);
          if (idx >= 0) newGroupFields[idx] = updated;
          const idxAll = updatedAllFields.findIndex(
            (f) => f._id === idInGroup._id,
          );
          if (idxAll >= 0) updatedAllFields[idxAll] = updated;
        }
      }
      updatedGroups[gi] = {
        ...gconf,
        fields: newGroupFields,
        _schema: this.tableSchemaService.computeSchema(newGroupFields),
      };
    }

    if (touched) {
      const _schema = this.tableSchemaService.computeSchema(
        updatedAllFields,
        updatedGroups,
      );
      await this.tableRepository.update({
        _id: info.tableId,
        _schema,
        groups: updatedGroups,
      });
      info.allFields = updatedAllFields;
      info.groups = updatedGroups;
    }
  }

  // ── Phase C/D: rows + backfill ────────────────────────────

  private stripRelationshipFields(
    row: Record<string, unknown>,
    table: ITable,
  ): Record<string, unknown> {
    const stripped: Record<string, unknown> = {};
    const relationshipSlugs = new Set<string>();
    for (const f of table.fields) {
      if (f.type === E_FIELD_TYPE.RELATIONSHIP) relationshipSlugs.add(f.slug);
    }
    for (const [key, value] of Object.entries(row)) {
      if (key === '_originalId' || key === '_id' || key === 'id') continue;
      if (key === 'createdAt' || key === 'updatedAt') continue;
      if (relationshipSlugs.has(key)) continue;
      // For FIELD_GROUP, strip relationships within each subrow
      const fg = table.groups?.find((g) => g.slug === key);
      if (fg && Array.isArray(value)) {
        const subSlugs = new Set(
          fg.fields
            .filter((f) => f.type === E_FIELD_TYPE.RELATIONSHIP)
            .map((f) => f.slug),
        );
        stripped[key] = value.map((sub: Record<string, unknown>) => {
          const cleaned: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(sub)) {
            if (k === '_originalId') continue;
            if (subSlugs.has(k)) continue;
            cleaned[k] = v;
          }
          return cleaned;
        });
        continue;
      }
      stripped[key] = value;
    }
    return stripped;
  }

  private async backfillRelationships(args: {
    table: ITable;
    rows: Array<Record<string, unknown> & { _originalId?: string }>;
    rowIdMap: Map<string, Map<string, string>>;
    ownerSlug: string;
  }): Promise<void> {
    const { table, rows, rowIdMap, ownerSlug } = args;
    const myMap = rowIdMap.get(ownerSlug);
    if (!myMap) return;

    const relationshipFields = table.fields.filter(
      (f) => f.type === E_FIELD_TYPE.RELATIONSHIP && f.relationship,
    );
    const groupRelationships = new Map<string, IField[]>();
    for (const g of table.groups || []) {
      const rels = g.fields.filter(
        (f) => f.type === E_FIELD_TYPE.RELATIONSHIP && f.relationship,
      );
      if (rels.length) groupRelationships.set(g.slug, rels);
    }

    if (relationshipFields.length === 0 && groupRelationships.size === 0) {
      return;
    }

    for (const row of rows) {
      const originalRowId = row._originalId ? String(row._originalId) : null;
      const newRowId = originalRowId ? myMap.get(originalRowId) : null;
      if (!newRowId) continue;

      const updateData: Record<string, unknown> = {};

      for (const field of relationshipFields) {
        const raw = row[field.slug];
        if (raw === undefined || raw === null) continue;
        const targetSlug = field.relationship!.table.slug;
        const remapped = this.remapRelationshipValue(raw, targetSlug, rowIdMap);
        if (remapped === undefined) continue;
        updateData[field.slug] = remapped;
      }

      for (const [groupSlug, rels] of groupRelationships.entries()) {
        const subRows = row[groupSlug];
        if (!Array.isArray(subRows)) continue;
        const newSubRows = subRows.map((sub: Record<string, unknown>) => {
          const updated: Record<string, unknown> = { ...sub };
          for (const f of rels) {
            const raw = sub[f.slug];
            if (raw === undefined || raw === null) continue;
            const remapped = this.remapRelationshipValue(
              raw,
              f.relationship!.table.slug,
              rowIdMap,
            );
            if (remapped !== undefined) updated[f.slug] = remapped;
          }
          return updated;
        });
        updateData[groupSlug] = newSubRows;
      }

      if (Object.keys(updateData).length === 0) continue;

      try {
        await this.rowRepository.update({
          table,
          _id: newRowId,
          data: updateData,
        });
      } catch (err) {
        console.error('[tools > import-table][row-backfill]:', err);
      }
    }
  }

  private remapRelationshipValue(
    value: unknown,
    targetTableSlug: string,
    rowIdMap: Map<string, Map<string, string>>,
  ): string | string[] | undefined {
    const target = rowIdMap.get(targetTableSlug);
    const remapOne = (v: unknown): string | null => {
      const id = typeof v === 'string' ? v : String(v ?? '');
      if (!id) return null;
      if (target?.has(id)) return target.get(id)!;
      // Target table is outside the package — return original (may match an
      // existing record if importing into the same DB or a snapshot of it).
      return id;
    };
    if (Array.isArray(value)) {
      const ids = value
        .map(remapOne)
        .filter((v): v is string => Boolean(v));
      return ids;
    }
    const single = remapOne(value);
    return single ?? undefined;
  }

  // ── Phase E: menus ────────────────────────────────────────

  private async importMenus(args: {
    menus: ExportedMenu[];
    tableSlugToInfo: Map<
      string,
      { originalSlug: string; newSlug: string; tableId?: string }
    >;
    ownerId: string;
  }): Promise<number> {
    const { menus, tableSlugToInfo, ownerId } = args;
    if (menus.length === 0) return 0;

    const tableSlugMap = new Map<string, { id: string; newSlug: string }>();
    for (const info of tableSlugToInfo.values()) {
      if (info.tableId) {
        tableSlugMap.set(info.originalSlug, {
          id: info.tableId,
          newSlug: info.newSlug,
        });
      }
    }

    const byOriginalId = new Map<string, ExportedMenu>();
    for (const m of menus) byOriginalId.set(m._originalId, m);

    const newIdByOriginalId = new Map<string, string>();
    const created = new Set<string>();
    let importedCount = 0;

    const createMenu = async (menu: ExportedMenu): Promise<void> => {
      if (created.has(menu._originalId)) return;
      // Ensure parent is created first
      if (menu.parent) {
        const parent = byOriginalId.get(menu.parent);
        if (parent && !created.has(parent._originalId)) {
          await createMenu(parent);
        }
      }

      let tableId: string | null = null;
      let url: string | null = menu.url;
      let type = menu.type;
      if (menu.tableSlug) {
        const ref = tableSlugMap.get(menu.tableSlug);
        if (ref) {
          tableId = ref.id;
          if (type === E_MENU_ITEM_TYPE.TABLE) {
            url = '/tables/'.concat(ref.newSlug);
          } else if (type === E_MENU_ITEM_TYPE.FORM) {
            url = '/tables/'.concat(ref.newSlug).concat('/row/create');
          }
        } else {
          // Linked table is missing — fall back to SEPARATOR
          type = E_MENU_ITEM_TYPE.SEPARATOR;
          url = null;
        }
      }

      const parentId = menu.parent
        ? newIdByOriginalId.get(menu.parent) ?? null
        : null;

      try {
        const newMenu = await this.menuRepository.create({
          name: menu.name,
          slug: menu.slug,
          type: type as never,
          table: tableId,
          parent: parentId,
          url,
          html: menu.html,
          owner: ownerId,
          order: menu.order,
          isInitial: false,
          extension: menu.extension ?? null,
        });
        newIdByOriginalId.set(menu._originalId, newMenu._id);
        created.add(menu._originalId);
        importedCount++;
      } catch (err) {
        console.error('[tools > import-table][menu-create]:', err);
      }
    };

    for (const menu of menus) {
      await createMenu(menu);
    }

    return importedCount;
  }
}
