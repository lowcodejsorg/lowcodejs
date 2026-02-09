import { FileTextIcon } from 'lucide-react';
import { z } from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_TABLE_STYLE, E_TABLE_VISIBILITY } from '@/lib/constant';

export const TableCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres'),
  logo: z.string().nullable().default(null),
  logoFile: z.array(z.custom<File>()).default([]),
  style: z.enum([
    E_TABLE_STYLE.LIST,
    E_TABLE_STYLE.GALLERY,
    E_TABLE_STYLE.DOCUMENT,
  ]),
  visibility: z.enum([
    E_TABLE_VISIBILITY.PUBLIC,
    E_TABLE_VISIBILITY.RESTRICTED,
    E_TABLE_VISIBILITY.OPEN,
    E_TABLE_VISIBILITY.FORM,
    E_TABLE_VISIBILITY.PRIVATE,
  ]),
});

export type TableCreateFormValues = {
  name: string;
  logo: string | null;
  logoFile: Array<File>;
  style: (typeof E_TABLE_STYLE)[keyof typeof E_TABLE_STYLE];
  visibility: (typeof E_TABLE_VISIBILITY)[keyof typeof E_TABLE_VISIBILITY];
};

export const tableCreateFormDefaultValues: TableCreateFormValues = {
  name: '',
  logo: null,
  logoFile: [],
  style: E_TABLE_STYLE.LIST,
  visibility: E_TABLE_VISIBILITY.RESTRICTED,
};

export const CreateTableFormFields = withForm({
  defaultValues: tableCreateFormDefaultValues,
  props: {
    isPending: false,
  },
  render: function Render({ form, isPending }) {
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
              disabled={isPending}
              icon={<FileTextIcon />}
              required
            />
          )}
        </form.AppField>

        {/* Campo Layout de Visualização */}
        <form.AppField name="style">
          {(field) => (
            <field.TableStyleSelectField
              label="Layout de visualização"
              placeholder="Selecione o estilo de visualização"
              disabled={isPending}
              allowedStyles={[
                E_TABLE_STYLE.LIST,
                E_TABLE_STYLE.GALLERY,
                E_TABLE_STYLE.DOCUMENT,
              ]}
            />
          )}
        </form.AppField>

        {/* Campo Visibilidade */}
        <form.AppField name="visibility">
          {(field) => (
            <field.TableVisibilitySelectField
              label="Visibilidade"
              placeholder="Selecione a visibilidade"
              disabled={isPending}
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
