import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useUpdateProfile } from '@/integrations/tanstack-query/implementations/use-profile-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { IUser } from '@/lib/interfaces';
import { Route as LayoutRoute } from '@/routes/_private/layout';
import { useForm } from '@tanstack/react-form';
import { AxiosError } from 'axios';
import { EyeClosedIcon, EyeIcon, MailIcon, UserIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import z from 'zod';

type UpdateProfileFormProps = {
  data: IUser;
};

const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.email('Digite um e-mail válido').min(1, 'E-mail é obrigatório'),
  group: z.string().min(1, 'Grupo é obrigatório'),
  allowPasswordChange: z.boolean(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export function UpdateProfileForm({ data }: UpdateProfileFormProps) {
  const { queryClient } = getContext();
  const loader = LayoutRoute.useLoaderData();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');
  const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

  const [show, setShow] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const _update = useUpdateProfile({
    onSuccess(data) {
      queryClient.setQueryData<IUser>(['/profile', loader.sub], data);

      toast('Perfil atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do perfil foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
      setAllowPasswordChange(false);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao atualizar o perfil', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao atualizar o perfil',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: data.name,
      email: data.email,
      group: data.group._id,
      allowPasswordChange: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      const validation = ProfileUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      // Validar se as senhas coincidem quando allowPasswordChange está ativo
      if (allowPasswordChange && value.newPassword !== value.confirmPassword) {
        toast('As senhas não coincidem', {
          className: '!bg-destructive !text-white !border-destructive',
          description: 'A nova senha e a confirmação devem ser iguais',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
        return;
      }

      const payload: any = {
        name: value.name.trim(),
        email: value.email.trim(),
        group: value.group,
        allowPasswordChange,
      };

      if (allowPasswordChange) {
        payload.currentPassword = value.currentPassword?.trim();
        payload.newPassword = value.newPassword?.trim();
      }

      await _update.mutateAsync(payload);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <section className="space-y-4 p-2">
        {/* Campo Nome */}
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Nome é obrigatório' };
              }
              return undefined;
            },
          }}
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={mode === 'show' || _update.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Digite o nome completo"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <UserIcon />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Email */}
        <form.Field
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
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={mode === 'show' || _update.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="exemplo@email.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Grupo (read-only card) */}
        <div className="space-y-2">
          <FieldLabel>Grupo</FieldLabel>
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="space-y-2">
              <p className="font-medium">{data.group.name}</p>
              <p className="text-sm text-muted-foreground">
                {data.group.description || 'Sem descrição disponível'}
              </p>
              <div className="flex flex-wrap gap-1">
                {data.group.permissions?.map((permission) => (
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

        {/* Switch Change Password */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FieldLabel>Alterar senha</FieldLabel>
            <p className="text-sm text-muted-foreground">
              Ative esta opção para atualizar sua senha
            </p>
          </div>
          <Switch
            disabled={mode === 'show' || _update.status === 'pending'}
            checked={allowPasswordChange}
            onCheckedChange={setAllowPasswordChange}
          />
        </div>

        {/* Campos de senha (condicionais) */}
        {allowPasswordChange && (
          <>
            {/* Current Password */}
            <form.Field
              name="currentPassword"
              validators={{
                onBlur: ({ value }) => {
                  if (allowPasswordChange && (!value || value.trim() === '')) {
                    return { message: 'Senha atual é obrigatória' };
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Senha atual <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        type={show[field.name] ? 'text' : 'password'}
                        placeholder="Digite sua senha atual"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          type="button"
                          aria-label="toggle password visibility"
                          title="toggle password visibility"
                          onClick={() =>
                            setShow((state) => ({
                              ...state,
                              [field.name]: !state[field.name],
                            }))
                          }
                        >
                          {show[field.name] && <EyeClosedIcon />}
                          {!show[field.name] && <EyeIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* New Password */}
            <form.Field
              name="newPassword"
              validators={{
                onBlur: ({ value }) => {
                  if (allowPasswordChange && (!value || value.trim() === '')) {
                    return { message: 'Nova senha é obrigatória' };
                  }

                  if (allowPasswordChange && value && value.length < 8) {
                    return {
                      message: 'Senha deve ter pelo menos 8 caracteres',
                    };
                  }

                  if (allowPasswordChange && !/[A-Z]/.test(value)) {
                    return {
                      message:
                        'Senha deve conter pelo menos uma letra maiúscula',
                    };
                  }

                  if (allowPasswordChange && !/[a-z]/.test(value)) {
                    return {
                      message:
                        'Senha deve conter pelo menos uma letra minúscula',
                    };
                  }

                  if (allowPasswordChange && !/[0-9]/.test(value)) {
                    return {
                      message: 'Senha deve conter pelo menos um número',
                    };
                  }

                  if (
                    allowPasswordChange &&
                    !/[!@#$%^&*(),.?":{}|<>]/.test(value)
                  ) {
                    return {
                      message:
                        'Senha deve conter pelo menos um caractere especial',
                    };
                  }

                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Nova senha <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        type={show[field.name] ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          type="button"
                          aria-label="toggle password visibility"
                          title="toggle password visibility"
                          onClick={() =>
                            setShow((state) => ({
                              ...state,
                              [field.name]: !state[field.name],
                            }))
                          }
                        >
                          {show[field.name] && <EyeClosedIcon />}
                          {!show[field.name] && <EyeIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Confirm Password */}
            <form.Field
              name="confirmPassword"
              validators={{
                onBlur: ({ value }) => {
                  if (allowPasswordChange && (!value || value.trim() === '')) {
                    return { message: 'Confirmação de senha é obrigatória' };
                  }

                  const newPassword = form.getFieldValue('newPassword');
                  if (allowPasswordChange && value !== newPassword) {
                    return { message: 'As senhas não coincidem' };
                  }

                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirmar nova senha{' '}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        type={show[field.name] ? 'text' : 'password'}
                        placeholder="Confirme sua nova senha"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          type="button"
                          aria-label="toggle password visibility"
                          title="toggle password visibility"
                          onClick={() =>
                            setShow((state) => ({
                              ...state,
                              [field.name]: !state[field.name],
                            }))
                          }
                        >
                          {show[field.name] && <EyeClosedIcon />}
                          {!show[field.name] && <EyeIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </>
        )}

        <Field className="inline-flex justify-end flex-1 items-end">
          {mode === 'show' && (
            <Button
              type="button"
              className="w-full max-w-3xs"
              onClick={() => {
                setMode('edit');
              }}
            >
              <span>Editar</span>
            </Button>
          )}

          {mode === 'edit' && (
            <div className="inline-flex space-x-2 items-end justify-end">
              <Button
                type="reset"
                variant="outline"
                className="w-full max-w-3xs"
                disabled={_update.status === 'pending'}
                onClick={() => {
                  form.reset();
                  setMode('show');
                  setAllowPasswordChange(false);
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
                type="submit"
                className="w-full max-w-3xs"
                disabled={_update.status === 'pending'}
              >
                {_update.status === 'pending' && <Spinner />}
                <span>Salvar</span>
              </Button>
            </div>
          )}
        </Field>
      </section>
    </form>
  );
}
