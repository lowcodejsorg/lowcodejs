import { GroupCombobox } from '@/components/common/group-combobox';
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
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import { IUser, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useUpdateUser } from '@/tanstack-query/use-user-update';
import { useForm } from '@tanstack/react-form';
import { AxiosError } from 'axios';
import { EyeClosedIcon, EyeIcon, MailIcon, UserIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import z from 'zod';
type UpdateUserFormProps = {
  data: IUser;
};

const UserUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.email('Digite um e-mail válido').min(1, 'E-mail é obrigatório'),
  password: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  group: z.string().min(1, 'Grupo é obrigatório'),
});

export function UpdateUserForm({ data }: UpdateUserFormProps) {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const [show, setShow] = React.useState({
    password: false,
  });

  const _update = useUpdateUser({
    onSuccess(data) {
      queryClient.setQueryData<IUser>(
        ['/users/'.concat(data._id), data._id],
        data,
      );
      queryClient.setQueryData<Paginated<IUser>>(
        [
          '/users/paginated',
          {
            page: 1,
            perPage: 50,
          },
        ],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: cached.meta,
            data: cached.data.map((item) => {
              if (item._id === data._id)
                return {
                  ...item,
                  ...data,
                };

              return item;
            }),
          };
        },
      );

      toast('Usuário atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do usuário foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao atualizar o usuário', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao atualizar o usuário',
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
      password: '',
      status: data.status,
      group: data.group._id,
    },
    onSubmit: async ({ value }) => {
      const validation = UserUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        ...value,
        _id: data._id,
        password: value.password !== '' ? value.password : undefined,
      });
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

        {/* Campo Senha (opcional, só em modo edição) */}
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Senha (opcional)</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={mode === 'show' || _update.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type={show[field.name] ? 'text' : 'password'}
                    placeholder="Digite nova senha se quiser alterá-la"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      disabled={mode === 'show' || _update.status === 'pending'}
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Status como Switch */}
        <form.Field
          name="status"
          children={(field) => (
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FieldLabel>Status do usuário</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Defina se o usuário está ativo ou inativo no sistema
                </p>
              </div>
              <div className="inline-flex space-x-2 items-center">
                <span className="text-sm text-muted-foreground">Inativo</span>
                <Switch
                  disabled={mode === 'show' || _update.status === 'pending'}
                  checked={field.state.value === 'active'}
                  onCheckedChange={(checked) => {
                    field.handleChange(checked ? 'active' : 'inactive');
                  }}
                />
                <span className="text-sm text-muted-foreground">Ativo</span>
              </div>
            </div>
          )}
        />

        {/* Campo Grupo */}
        <form.Field
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
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Grupo <span className="text-destructive">*</span>
                </FieldLabel>
                <GroupCombobox
                  disabled={mode === 'show' || _update.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value);
                  }}
                  placeholder="Selecione um grupo..."
                  className={cn(isInvalid && 'border-destructive')}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

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
