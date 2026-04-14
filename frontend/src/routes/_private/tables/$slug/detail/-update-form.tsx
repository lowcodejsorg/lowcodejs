import { FileTextIcon } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_TYPE, E_TABLE_STYLE, TABLE_NAME_REGEX } from '@/lib/constant';
import type { IField, ILayoutFields, ITable } from '@/lib/interfaces';
import { getAllowedTableStyles } from '@/lib/table-style';

const LayoutFieldsSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  cover: z.string().default(''),
  category: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  color: z.string().default(''),
  participants: z.string().default(''),
  reminder: z.string().default(''),
});

// Schema estendido com campos de UI (logoFile)
export const TableUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres'),
  description: z.string().default(''),
  style: z.enum([
    E_TABLE_STYLE.LIST,
    E_TABLE_STYLE.GALLERY,
    E_TABLE_STYLE.DOCUMENT,
    E_TABLE_STYLE.CARD,
    E_TABLE_STYLE.MOSAIC,
    E_TABLE_STYLE.KANBAN,
    E_TABLE_STYLE.FORUM,
    E_TABLE_STYLE.CALENDAR,
    E_TABLE_STYLE.GANTT,
  ]),
  viewTable: z.string().default('PUBLIC'),
  updateTable: z.string().default('PUBLIC'),
  createField: z.string().default('PUBLIC'),
  updateField: z.string().default('PUBLIC'),
  removeField: z.string().default('PUBLIC'),
  viewField: z.string().default('PUBLIC'),
  createRow: z.string().default('PUBLIC'),
  updateRow: z.string().default('PUBLIC'),
  removeRow: z.string().default('PUBLIC'),
  viewRow: z.string().default('PUBLIC'),
  logo: z.string().nullable().default(null),
  logoFile: z.array(z.custom<File>()).default([]),
  order: z.string().default('none'),
  layoutFields: LayoutFieldsSchema.default({
    title: '',
    description: '',
    cover: '',
    category: '',
    startDate: '',
    endDate: '',
    color: '',
    participants: '',
    reminder: '',
  }),
});

export type TableUpdateFormValues = z.infer<typeof TableUpdateSchema>;

export const tableUpdateFormDefaultValues: TableUpdateFormValues = {
  name: '',
  description: '',
  style: E_TABLE_STYLE.LIST,
  viewTable: 'PUBLIC',
  updateTable: 'PUBLIC',
  createField: 'PUBLIC',
  updateField: 'PUBLIC',
  removeField: 'PUBLIC',
  viewField: 'PUBLIC',
  createRow: 'PUBLIC',
  updateRow: 'PUBLIC',
  removeRow: 'PUBLIC',
  viewRow: 'PUBLIC',
  logo: null,
  logoFile: [],
  order: 'none',
  layoutFields: {
    title: '',
    description: '',
    cover: '',
    category: '',
    startDate: '',
    endDate: '',
    color: '',
    participants: '',
    reminder: '',
  },
};

export const UpdateTableFormFields = withForm({
  defaultValues: tableUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    tableData: null as ITable | null,
  },
  render: function Render({ form, isPending, mode, tableData }) {
    const isDisabled = mode === 'show' || isPending;

    const orderOptions = React.useMemo(() => {
      const fields = tableData?.fields?.filter((f) => !f.trashed) ?? [];
      const options: Array<{ label: string; value: string }> = [
        { label: 'Nenhuma', value: 'none' },
      ];
      for (const f of fields) {
        options.push({
          label: `${f.name} (Ascendente)`,
          value: `${f.slug}:asc`,
        });
        options.push({
          label: `${f.name} (Descendente)`,
          value: `${f.slug}:desc`,
        });
      }
      return options;
    }, [tableData]);

    const activeFields = React.useMemo(
      () => tableData?.fields?.filter((f: IField) => !f.trashed) ?? [],
      [tableData],
    );

    const fieldOptionsByType = React.useCallback(
      (type: string) =>
        activeFields
          .filter((f: IField) => f.type === type)
          .map((f: IField) => ({ label: f.name, value: f._id })),
      [activeFields],
    );

    const LAYOUT_ROLE_CONFIG: Record<
      string,
      Array<{
        role: keyof ILayoutFields;
        label: string;
        type: string;
      }>
    > = {
      [E_TABLE_STYLE.CARD]: [
        { role: 'title', label: 'Título', type: E_FIELD_TYPE.TEXT_SHORT },
        {
          role: 'description',
          label: 'Descrição',
          type: E_FIELD_TYPE.TEXT_LONG,
        },
        { role: 'cover', label: 'Capa (imagem)', type: E_FIELD_TYPE.FILE },
      ],
      [E_TABLE_STYLE.MOSAIC]: [
        { role: 'title', label: 'Título', type: E_FIELD_TYPE.TEXT_SHORT },
        {
          role: 'description',
          label: 'Descrição',
          type: E_FIELD_TYPE.TEXT_LONG,
        },
        { role: 'cover', label: 'Capa (imagem)', type: E_FIELD_TYPE.FILE },
      ],
      [E_TABLE_STYLE.GALLERY]: [
        { role: 'title', label: 'Título', type: E_FIELD_TYPE.TEXT_SHORT },
        {
          role: 'description',
          label: 'Descrição',
          type: E_FIELD_TYPE.TEXT_LONG,
        },
        { role: 'cover', label: 'Capa (imagem)', type: E_FIELD_TYPE.FILE },
      ],
      [E_TABLE_STYLE.DOCUMENT]: [
        { role: 'title', label: 'Título', type: E_FIELD_TYPE.TEXT_SHORT },
        {
          role: 'description',
          label: 'Descrição',
          type: E_FIELD_TYPE.TEXT_LONG,
        },
        { role: 'category', label: 'Categoria', type: E_FIELD_TYPE.CATEGORY },
      ],
      [E_TABLE_STYLE.CALENDAR]: [
        { role: 'title', label: 'Título', type: E_FIELD_TYPE.TEXT_SHORT },
        {
          role: 'description',
          label: 'Descrição',
          type: E_FIELD_TYPE.TEXT_LONG,
        },
        { role: 'startDate', label: 'Data de início', type: E_FIELD_TYPE.DATE },
        { role: 'endDate', label: 'Data de término', type: E_FIELD_TYPE.DATE },
        { role: 'color', label: 'Cor', type: E_FIELD_TYPE.DROPDOWN },
        {
          role: 'participants',
          label: 'Participantes',
          type: E_FIELD_TYPE.USER,
        },
        {
          role: 'reminder',
          label: 'Lembrete',
          type: E_FIELD_TYPE.FIELD_GROUP,
        },
      ],
    };

    return (
      <section
        data-test-id="table-update-form-fields"
        className="space-y-4 p-2"
      >
        {/* Campo Logo */}
        <form.AppField name="logoFile">
          {(field) => (
            <field.FieldFileUpload
              label="Logo"
              accept="image/*"
              maxFiles={1}
              maxSize={4 * 1024 * 1024}
              placeholder="Arraste e solte a imagem do logo"
              shouldDeleteFromStorage
              onStorageChange={(storages) => {
                if (storages[0]?._id) {
                  form.setFieldValue('logo', storages[0]._id);
                }
              }}
              showPreview={mode === 'show'}
              previewUrl={tableData?.logo?.url}
              previewAlt={tableData?.logo?.filename}
            />
          )}
        </form.AppField>

        {/* Campo Nome */}
        <form.AppField
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim() === '') {
                return 'Nome é obrigatório';
              }
              if (value.length > 40) {
                return 'Nome deve ter no máximo 40 caracteres';
              }
              if (!TABLE_NAME_REGEX.test(value)) {
                return {
                  message: 'O nome não pode conter caracteres especiais',
                };
              }
              return undefined;
            },
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return 'Nome é obrigatório';
              }
              if (value.length > 40) {
                return 'Nome deve ter no máximo 40 caracteres';
              }
              if (!TABLE_NAME_REGEX.test(value)) {
                return {
                  message: 'O nome não pode conter caracteres especiais',
                };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldText
              label="Nome"
              placeholder="Digite o nome da tabela"
              disabled={isDisabled}
              icon={<FileTextIcon />}
              required
            />
          )}
        </form.AppField>

        {/* Campo Descrição */}
        <form.AppField name="description">
          {(field) => (
            <field.FieldTextarea
              label="Descrição"
              placeholder="Digite uma descrição para a tabela"
              disabled={isDisabled}
              rows={3}
            />
          )}
        </form.AppField>

        {/* Campo Style */}
        <form.AppField name="style">
          {(field) => (
            <field.TableStyleSelectField
              label="Layout de visualização"
              placeholder="Selecione o estilo de visualização"
              disabled={isDisabled}
              allowedStyles={getAllowedTableStyles(tableData)}
            />
          )}
        </form.AppField>

        {/* Campos do Layout */}
        <form.Subscribe selector={(state) => state.values.style}>
          {(currentStyle) => {
            const layoutRoles = LAYOUT_ROLE_CONFIG[currentStyle] ?? [];
            if (layoutRoles.length === 0) return null;
            return (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Campos do Layout
                </p>
                {layoutRoles.map((item) => (
                  <form.AppField
                    key={item.role}
                    name={`layoutFields.${item.role}`}
                  >
                    {(field) => (
                      <field.TableLayoutFieldSelect
                        label={item.label}
                        disabled={isDisabled}
                        options={fieldOptionsByType(item.type)}
                      />
                    )}
                  </form.AppField>
                ))}
              </div>
            );
          }}
        </form.Subscribe>

        {/* Permissoes de acoes */}
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium text-muted-foreground">
            Permissões de acesso
          </p>

          <form.AppField name="viewTable">
            {(field) => (
              <field.FieldPermissionSelect
                label="Visualizar tabela"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="updateTable">
            {(field) => (
              <field.FieldPermissionSelect
                label="Editar tabela"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="createField">
            {(field) => (
              <field.FieldPermissionSelect
                label="Criar campo"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="updateField">
            {(field) => (
              <field.FieldPermissionSelect
                label="Editar campo"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="removeField">
            {(field) => (
              <field.FieldPermissionSelect
                label="Remover campo"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="viewField">
            {(field) => (
              <field.FieldPermissionSelect
                label="Visualizar campo"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="createRow">
            {(field) => (
              <field.FieldPermissionSelect
                label="Criar registro"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="updateRow">
            {(field) => (
              <field.FieldPermissionSelect
                label="Editar registro"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="removeRow">
            {(field) => (
              <field.FieldPermissionSelect
                label="Remover registro"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>

          <form.AppField name="viewRow">
            {(field) => (
              <field.FieldPermissionSelect
                label="Visualizar registro"
                mode="table"
                disabled={isDisabled}
              />
            )}
          </form.AppField>
        </div>

        {/* TODO: Adicionar seção de collaborators (array de {user, profile}) */}

        {/* Ordenação padrão */}
        <form.AppField name="order">
          {(field) => (
            <field.TableOrderSelectField
              label="Ordenação padrão"
              description="Define a ordenação padrão dos registros na listagem"
              placeholder="Selecione uma ordenação"
              disabled={isDisabled}
              options={orderOptions}
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
