import { UserIcon } from 'lucide-react';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_USER_STATUS } from '@/lib/constant';
import type { ValueOf } from '@/lib/interfaces';
import { UserUpdateFormSchema } from '@/lib/schemas';

export const UserUpdateSchema = UserUpdateFormSchema;
export type UserUpdateFormValues = {
  name: string;
  email: string;
  password: string;
  status: ValueOf<typeof E_USER_STATUS>;
  group: string;
};

export const userUpdateFormDefaultValues: UserUpdateFormValues = {
  name: '',
  email: '',
  password: '',
  status: E_USER_STATUS.ACTIVE,
  group: '',
};

export const UpdateUserFormFields = withForm({
  defaultValues: userUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
  },
  render: function Render({ form, isPending, mode }) {
    const isDisabled = mode === 'show' || isPending;

    return (
      <section className="space-y-4 p-2">
        {/* Campo Nome */}
        <form.AppField name="name">
          {(field) => (
            <field.FieldText
              label="Nome"
              placeholder="Digite o nome completo"
              disabled={isDisabled}
              icon={<UserIcon />}
            />
          )}
        </form.AppField>

        {/* Campo Email */}
        <form.AppField name="email">
          {(field) => (
            <field.FieldEmail
              label="E-mail"
              placeholder="exemplo@email.com"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Senha (opcional) */}
        <form.AppField name="password">
          {(field) => (
            <field.FieldPassword
              label="Senha (opcional)"
              placeholder="Digite nova senha se quiser alterá-la"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Status como Switch */}
        <form.AppField name="status">
          {(field) => (
            <field.FieldSwitch
              label="Status do usuário"
              description="Defina se o usuário está ativo ou inativo no sistema"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Grupo */}
        <form.AppField name="group">
          {(field) => (
            <field.FieldGroupCombobox
              label="Grupo"
              placeholder="Selecione um grupo..."
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
