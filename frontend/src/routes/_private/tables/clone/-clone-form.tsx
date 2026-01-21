import { FileTextIcon } from 'lucide-react';
import { z } from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { useSettingRead } from '@/hooks/tanstack-query/use-setting-read';
import { useTablesReadPaginated } from '@/hooks/tanstack-query/use-tables-read-paginated';

import { FilteredTableComboboxField } from '@/components/common/tanstack-form/filtered-table-combobox-field';

export const TableCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres'),

  MODEL_CLONE_TABLES: z
    .string()
    .min(1, 'Selecione um modelo'),
});

export type TableCreateFormValues = {
  name: string;
  MODEL_CLONE_TABLES: string;
};

export const tableCreateFormDefaultValues: TableCreateFormValues = {
  name: '',
  MODEL_CLONE_TABLES: '',
};

export const CreateTableFormFields = withForm({
  defaultValues: tableCreateFormDefaultValues,
  props: {
    isPending: false,
  },
  render: function Render({ form, isPending }) {
    const { data, isLoading: isLoadingTables } = useTablesReadPaginated();
    const tables = data?.data ?? [];

    const { data: settings, isLoading: isLoadingSettings } = useSettingRead();

    const allowedIds: string[] = Array.isArray(settings?.MODEL_CLONE_TABLES)
    ? settings.MODEL_CLONE_TABLES.map((v) =>
        typeof v === 'string' ? v.trim() : String(v._id ?? v).trim()
      )
    : typeof settings?.MODEL_CLONE_TABLES === 'string'
      ? settings.MODEL_CLONE_TABLES.split(',').map((id) => id.trim())
      : [];

    if (isLoadingTables || isLoadingSettings) {
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
                tables={tables}
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
