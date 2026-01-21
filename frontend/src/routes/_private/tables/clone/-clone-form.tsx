import { FileTextIcon } from 'lucide-react';
import { z } from 'zod';

import { FilteredTableComboboxField } from '@/components/common/tanstack-form/filtered-table-combobox-field';
import { useSettingRead } from '@/hooks/tanstack-query/use-setting-read';
import { withForm } from '@/integrations/tanstack-form/form-hook';

export const CloneTableBodySchema = z.object({
  name: z
    .string({ message: 'O nome é obrigatório' })
    .trim()
    .min(1, 'O nome é obrigatório')
    .max(40, 'O nome deve ter no máximo 40 caracteres'),

  MODEL_CLONE_TABLES: z
    .string({ message: 'O modelo é obrigatório' })
    .trim()
    .min(1, 'Selecione um modelo'),
});

export type CloneTableFormValues = {
  name: string;
  MODEL_CLONE_TABLES: string;
};

export const cloneTableFormDefaultValues: CloneTableFormValues = {
  name: '',
  MODEL_CLONE_TABLES: '',
};

export const CloneTableFormFields = withForm({
  defaultValues: cloneTableFormDefaultValues,
  props: {
    isPending: false,
  },
  render: function Render({ form, isPending }) {
    const { data: settings, isLoading: isLoadingSettings } = useSettingRead();

    const allowedIds: Array<string> = Array.isArray(
      settings?.MODEL_CLONE_TABLES,
    )
      ? settings.MODEL_CLONE_TABLES.map((v: string) => v.trim())
      : [];

    if (isLoadingSettings) {
      return null;
    }

    return (
      <section className="space-y-4 p-2">
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

        {/* Campo Modelo */}
        {allowedIds.length > 0 && (
          <form.AppField
            name="MODEL_CLONE_TABLES"
            validators={{
              onBlur: ({ value }) => {
                if (!value) {
                  return { message: 'Selecione um modelo' };
                }
              },
            }}
          >
            {() => (
              <FilteredTableComboboxField
                label="Modelos disponíveis"
                placeholder="Selecione o modelo..."
                required
                allowedTableIds={allowedIds}
                mapOption={(table) => ({
                  value: table._id,
                  label: `${table.name}`,
                })}
              />
            )}
          </form.AppField>
        )}
      </section>
    );
  },
});
