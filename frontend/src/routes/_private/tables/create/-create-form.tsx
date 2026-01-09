import { FileTextIcon } from 'lucide-react';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import type { TableCreatePayload } from '@/lib/payloads';
import { TableCreateBodySchema } from '@/lib/schemas';

export const TableCreateSchema = TableCreateBodySchema;
export type TableCreateFormValues = TableCreatePayload;

export const tableCreateFormDefaultValues: TableCreateFormValues = {
  name: '',
};

export const CreateTableFormFields = withForm({
  defaultValues: tableCreateFormDefaultValues,
  props: {
    isPending: false,
  },
  render: function Render({ form, isPending }) {
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
      </section>
    );
  },
});
