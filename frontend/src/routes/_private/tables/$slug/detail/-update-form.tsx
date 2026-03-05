import { FileTextIcon } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@/lib/constant';
import type { ITable, ValueOf } from '@/lib/interfaces';
import { getAllowedTableStyles } from '@/lib/table-style';

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
  ]),
  visibility: z.enum([
    E_TABLE_VISIBILITY.PUBLIC,
    E_TABLE_VISIBILITY.RESTRICTED,
    E_TABLE_VISIBILITY.OPEN,
    E_TABLE_VISIBILITY.FORM,
    E_TABLE_VISIBILITY.PRIVATE,
  ]),
  collaboration: z.enum([
    E_TABLE_COLLABORATION.OPEN,
    E_TABLE_COLLABORATION.RESTRICTED,
  ]),
  logo: z.string().nullable().default(null),
  logoFile: z.array(z.custom<File>()).default([]),
  administrators: z.array(z.string()).default([]),
  order: z.string().default('none'),
});

export type TableUpdateFormValues = {
  name: string;
  description: string;
  style: ValueOf<typeof E_TABLE_STYLE>;
  visibility: ValueOf<typeof E_TABLE_VISIBILITY>;
  collaboration: ValueOf<typeof E_TABLE_COLLABORATION>;
  logo: string | null;
  logoFile: Array<File>;
  administrators: Array<string>;
  order: string;
};

export const tableUpdateFormDefaultValues: TableUpdateFormValues = {
  name: '',
  description: '',
  style: E_TABLE_STYLE.LIST,
  visibility: E_TABLE_VISIBILITY.RESTRICTED,
  collaboration: E_TABLE_COLLABORATION.RESTRICTED,
  logo: null,
  logoFile: [],
  administrators: [],
  order: 'none',
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

    return (
      <section className="space-y-4 p-2">
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
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Nome é obrigatório' };
              }
              if (value.length > 40) {
                return { message: 'Nome deve ter no máximo 40 caracteres' };
              }
              if (
                !/^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/.test(value)
              ) {
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

        {/* Campo Visibility */}
        <form.AppField
          name="visibility"
          validators={{
            onBlur: ({ value }) => {
              if (value.trim() === '') {
                return { message: 'Visibilidade é obrigatória' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.TableVisibilitySelectField
              label="Visibilidade"
              placeholder="Selecione a visibilidade"
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>

        {/* Campo Collaboration */}
        <form.AppField
          name="collaboration"
          validators={{
            onBlur: ({ value }) => {
              if (value.trim() === '') {
                return { message: 'Colaboração é obrigatória' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.TableCollaborationSelectField
              label="Colaboração"
              placeholder="Selecione o modo de colaboração"
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>

        {/* Campo Administradores */}
        <form.AppField name="administrators">
          {(field) => (
            <field.FieldUserMultiSelect
              label="Administradores"
              placeholder="Selecione administradores"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Ordenação padrão */}
        <form.AppField name="order">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Ordenação padrão</FieldLabel>
              <p className="text-sm text-muted-foreground">
                Define a ordenação padrão dos registros na listagem
              </p>
              <Select
                disabled={isDisabled}
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ordenação" />
                </SelectTrigger>
                <SelectContent>
                  {orderOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.AppField>
      </section>
    );
  },
});
