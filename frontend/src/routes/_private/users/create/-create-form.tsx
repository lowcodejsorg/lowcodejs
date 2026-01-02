import { UserIcon } from 'lucide-react';
import z from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';

export const UserCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.email('Digite um e-mail válido').min(1, 'E-mail é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  group: z.string().min(1, 'Grupo é obrigatório'),
});

export type UserFormType = z.infer<typeof UserCreateSchema>;

export const userFormDefaultValues: UserFormType = {
  name: '',
  email: '',
  password: '',
  group: '',
};

export const CreateUserFormFields = withForm({
  defaultValues: userFormDefaultValues,
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
              placeholder="Digite o nome completo"
              disabled={isPending}
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
              disabled={isPending}
            />
          )}
        </form.AppField>

        {/* Campo Senha */}
        <form.AppField
          name="password"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Senha é obrigatória' };
              }
              if (value.length < 6) {
                return { message: 'Senha deve ter no mínimo 6 caracteres' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.PasswordField
              label="Senha"
              placeholder="Digite a senha"
              disabled={isPending}
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
              disabled={isPending}
              required
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
