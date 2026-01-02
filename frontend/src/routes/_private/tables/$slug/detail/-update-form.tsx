import { FileTextIcon } from 'lucide-react';
import z from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import type { ITable } from '@/lib/interfaces';

export const TableUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres'),
  description: z.string().default(''),
  style: z.enum(['list', 'gallery']),
  visibility: z.enum(['public', 'restricted', 'open', 'form']),
  collaboration: z.enum(['open', 'restricted']),
  logo: z.string().nullable().default(null),
  logoFile: z.array(z.custom<File>()).default([]),
});

export type TableUpdateFormValues = z.infer<typeof TableUpdateSchema>;

export const tableUpdateFormDefaultValues: TableUpdateFormValues = {
  name: '',
  description: '',
  style: 'list',
  visibility: 'restricted',
  collaboration: 'restricted',
  logo: null,
  logoFile: [],
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

    return (
      <section className="space-y-4 p-2">
        {/* Campo Logo */}
        <form.AppField name="logoFile">
          {(field) => (
            <field.FileUploadField
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
            <field.TextField
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
            <field.TextareaField
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
            <field.TableStyleSwitchField
              label="Layout de visualização"
              description="Defina como a tabela será exibida"
              disabled={isDisabled}
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
      </section>
    );
  },
});
