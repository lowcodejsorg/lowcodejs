import { GroupCombobox } from '@/components/common/group-combobox';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateUser } from '@/integrations/tanstack-query/implementations/use-user-create';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import { IUser, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { EyeClosedIcon, EyeIcon, MailIcon, UserIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import z from 'zod';

const UserCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.email('Digite um e-mail válido').min(1, 'E-mail é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  group: z.string().min(1, 'Grupo é obrigatório'),
});

export function CreateUserForm() {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const [show, setShow] = React.useState({
    password: false,
  });

  const _create = useCreateUser({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<IUser>>(
        ['/users/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: {
              ...cached.meta,
              total: cached.meta.total + 1,
            },
            data: [data, ...cached.data],
          };
        },
      );

      toast('Usuário criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O usuário foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/users', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao criar o usuário', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao criar o usuário',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      group: '',
    },
    onSubmit: async ({ value }) => {
      const validation = UserCreateSchema.safeParse(value);
      if (!validation.success) return;

      if (_create.status === 'pending') return;

      await _create.mutateAsync(value);
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
                    disabled={_create.status === 'pending'}
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
                    disabled={_create.status === 'pending'}
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

        {/* Campo Senha */}
        <form.Field
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
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={_create.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type={show[field.name] ? 'text' : 'password'}
                    placeholder="Digite a senha"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      disabled={_create.status === 'pending'}
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
                  disabled={_create.status === 'pending'}
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
          <div className="inline-flex space-x-2 items-end justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-3xs"
              disabled={_create.status === 'pending'}
              onClick={() => {
                navigate({ to: '/users', search: { page: 1, perPage: 50 } });
              }}
            >
              <span>Cancelar</span>
            </Button>
            <Button
              type="submit"
              className="w-full max-w-3xs"
              disabled={_create.status === 'pending'}
            >
              {_create.status === 'pending' && <Spinner />}
              <span>Criar</span>
            </Button>
          </div>
        </Field>
      </section>
    </form>
  );
}
