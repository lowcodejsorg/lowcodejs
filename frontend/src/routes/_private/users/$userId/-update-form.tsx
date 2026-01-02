import { UserIcon } from 'lucide-react';
import z from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';

export const UserUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.email('Digite um e-mail válido').min(1, 'E-mail é obrigatório'),
  password: z.string().default(''),
  status: z.enum(['active', 'inactive']),
  group: z.string().min(1, 'Grupo é obrigatório'),
});

export type UserUpdateFormValues = z.infer<typeof UserUpdateSchema>;

export const userUpdateFormDefaultValues: UserUpdateFormValues = {
  name: '',
  email: '',
  password: '',
  status: 'active',
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
              placeholder="Digite o nome completo"
              disabled={isDisabled}
              icon={<UserIcon />}
            />
          )}
        </form.AppField>

        {/* Campo Email */}
        <form.AppField
          name="email"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'E-mail é obrigatório' };
              }
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                return { message: 'Digite um e-mail válido' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.EmailField
              label="E-mail"
              placeholder="exemplo@email.com"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Senha (opcional) */}
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              label="Senha (opcional)"
              placeholder="Digite nova senha se quiser alterá-la"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Status como Switch */}
        <form.AppField name="status">
          {(field) => (
            <field.SwitchField
              label="Status do usuário"
              description="Defina se o usuário está ativo ou inativo no sistema"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Grupo */}
        <form.AppField
          name="group"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Grupo é obrigatório' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.GroupComboboxField
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
