import { UsersIcon } from 'lucide-react';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import type { UserGroupCreatePayload } from '@/lib/payloads';
import { UserGroupCreateBodySchema } from '@/lib/schemas';

export const GroupCreateSchema = UserGroupCreateBodySchema;
export type GroupFormType = UserGroupCreatePayload;

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
            <field.FieldText
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
            <field.FieldTextarea
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
            <field.FieldPermissionMultiSelect
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
