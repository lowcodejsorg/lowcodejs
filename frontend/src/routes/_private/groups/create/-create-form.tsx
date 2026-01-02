import { UsersIcon } from 'lucide-react';
import z from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';

export const GroupCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Selecione ao menos uma permissão'),
});

export type GroupFormType = z.infer<typeof GroupCreateSchema>;

export const groupFormDefaultValues: GroupFormType = {
  name: '',
  description: '',
  permissions: [],
};

export const CreateGroupFormFields = withForm({
  defaultValues: groupFormDefaultValues,
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
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.TextField
              label="Nome"
              placeholder="Digite o nome do grupo"
              disabled={isPending}
              icon={<UsersIcon />}
            />
          )}
        </form.AppField>

        {/* Campo Descrição */}
        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label="Descrição (opcional)"
              placeholder="Descrição do grupo (opcional)"
              disabled={isPending}
              rows={3}
            />
          )}
        </form.AppField>

        {/* Campo Permissões */}
        <form.AppField
          name="permissions"
          validators={{
            onBlur: ({ value }) => {
              if (value.length === 0) {
                return { message: 'Selecione ao menos uma permissão' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.PermissionMultiSelectField
              label="Permissões"
              placeholder="Selecione as permissões..."
              disabled={isPending}
              required
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
