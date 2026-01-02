import { UserIcon } from 'lucide-react';
import z from 'zod';

import { FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import type { IGroup } from '@/lib/interfaces';

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.email('Digite um e-mail válido').min(1, 'E-mail é obrigatório'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export type ProfileUpdateFormValues = z.infer<typeof ProfileUpdateSchema>;

export const profileUpdateFormDefaultValues: ProfileUpdateFormValues = {
  name: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export const UpdateProfileFormFields = withForm({
  defaultValues: profileUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    allowPasswordChange: false,
    onAllowPasswordChangeChange: (() => {}) as (value: boolean) => void,
    groupData: null as IGroup | null,
  },
  render: function Render({
    form,
    isPending,
    mode,
    allowPasswordChange,
    onAllowPasswordChangeChange,
    groupData,
  }) {
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

        {/* Grupo (read-only card) */}
        {groupData && (
          <div className="space-y-2">
            <FieldLabel>Grupo</FieldLabel>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="space-y-2">
                <p className="font-medium">{groupData.name}</p>
                <p className="text-sm text-muted-foreground">
                  {groupData.description || 'Sem descrição disponível'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {groupData.permissions.map((permission) => (
                    <span
                      key={permission.slug}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {permission.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Switch Change Password */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FieldLabel>Alterar senha</FieldLabel>
            <p className="text-sm text-muted-foreground">
              Ative esta opção para atualizar sua senha
            </p>
          </div>
          <Switch
            disabled={isDisabled}
            checked={allowPasswordChange}
            onCheckedChange={onAllowPasswordChangeChange}
          />
        </div>

        {/* Campos de senha (condicionais) */}
        {allowPasswordChange && (
          <>
            {/* Current Password */}
            <form.AppField
              name="currentPassword"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim() === '') {
                    return { message: 'Senha atual é obrigatória' };
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.PasswordField
                  label="Senha atual"
                  placeholder="Digite sua senha atual"
                  disabled={isDisabled}
                  required
                />
              )}
            </form.AppField>

            {/* New Password */}
            <form.AppField
              name="newPassword"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim() === '') {
                    return { message: 'Nova senha é obrigatória' };
                  }

                  if (value.length < 8) {
                    return {
                      message: 'Senha deve ter pelo menos 8 caracteres',
                    };
                  }

                  if (!/[A-Z]/.test(value)) {
                    return {
                      message:
                        'Senha deve conter pelo menos uma letra maiúscula',
                    };
                  }

                  if (!/[a-z]/.test(value)) {
                    return {
                      message:
                        'Senha deve conter pelo menos uma letra minúscula',
                    };
                  }

                  if (!/[0-9]/.test(value)) {
                    return {
                      message: 'Senha deve conter pelo menos um número',
                    };
                  }

                  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                    return {
                      message:
                        'Senha deve conter pelo menos um caractere especial',
                    };
                  }

                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.PasswordField
                  label="Nova senha"
                  placeholder="Digite sua nova senha"
                  disabled={isDisabled}
                  required
                />
              )}
            </form.AppField>

            {/* Confirm Password */}
            <form.AppField
              name="confirmPassword"
              validators={{
                onBlur: ({ value, fieldApi }) => {
                  if (!value || value.trim() === '') {
                    return { message: 'Confirmação de senha é obrigatória' };
                  }

                  const newPassword =
                    fieldApi.form.getFieldValue('newPassword');
                  if (value !== newPassword) {
                    return { message: 'As senhas não coincidem' };
                  }

                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.PasswordField
                  label="Confirmar nova senha"
                  placeholder="Confirme sua nova senha"
                  disabled={isDisabled}
                  required
                />
              )}
            </form.AppField>
          </>
        )}
      </section>
    );
  },
});
