import { PermissionMultiSelect } from '@/components/common/permission-multi-select';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import { IGroup, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useCreateGroup } from '@/tanstack-query/use-group-create';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import z from 'zod';

const GroupCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Selecione ao menos uma permissão'),
});

export function CreateGroupForm() {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const _create = useCreateGroup({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<IGroup>>(
        ['/user-group/paginated', { page: 1, perPage: 50 }],
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

      toast('Grupo criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O grupo foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao criar o grupo', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao criar o grupo',
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
      description: '',
      permissions: [] as string[],
    },
    onSubmit: async ({ value }) => {
      const validation = GroupCreateSchema.safeParse(value);
      if (!validation.success) return;

      if (_create.status === 'pending') return;

      await _create.mutateAsync({
        name: value.name,
        description: value.description || null,
        permissions: value.permissions,
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
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={_create.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Digite o nome do grupo"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <UsersIcon />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Descrição */}
        <form.Field
          name="description"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Descrição (opcional)</FieldLabel>
                <Textarea
                  disabled={_create.status === 'pending'}
                  id={field.name}
                  name={field.name}
                  placeholder="Descrição do grupo (opcional)"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  rows={3}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Permissões */}
        <form.Field
          name="permissions"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.length === 0) {
                return { message: 'Selecione ao menos uma permissão' };
              }
              return undefined;
            },
          }}
        >
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Permissões <span className="text-destructive">*</span>
                </FieldLabel>
                <PermissionMultiSelect
                  disabled={_create.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value);
                  }}
                  placeholder="Selecione as permissões..."
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
                navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
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
