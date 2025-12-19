import { PermissionMultiSelect } from '@/components/common/permission-multi-select';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import { IGroup, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useUpdateGroup } from '@/tanstack-query/use-group-update';
import { useForm } from '@tanstack/react-form';
import { AxiosError } from 'axios';
import { HashIcon, UsersIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import z from 'zod';

type UpdateGroupFormProps = {
  data: IGroup;
};

const GroupUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Selecione ao menos uma permissão'),
});

export function UpdateGroupForm({ data }: UpdateGroupFormProps) {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useUpdateGroup({
    onSuccess(data) {
      queryClient.setQueryData<IGroup>(
        ['/user-group/'.concat(data._id), data._id],
        data,
      );
      queryClient.setQueryData<Paginated<IGroup>>(
        [
          '/user-group/paginated',
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

      toast('Grupo atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do grupo foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao atualizar o grupo', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao atualizar o grupo',
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
      description: data.description ?? '',
      permissions: data.permissions.map((p) => p._id),
    },
    onSubmit: async ({ value }) => {
      const validation = GroupUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        ...value,
        _id: data._id,
        description: value.description || null,
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
        {/* Campo Slug (read-only) */}
        <Field>
          <FieldLabel>Slug (identificador)</FieldLabel>
          <InputGroup>
            <InputGroupInput
              disabled
              type="text"
              value={data.slug}
              readOnly
              className="bg-muted"
            />
            <InputGroupAddon>
              <HashIcon />
            </InputGroupAddon>
          </InputGroup>
        </Field>

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
                    disabled={mode === 'show' || _update.status === 'pending'}
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
                  disabled={mode === 'show' || _update.status === 'pending'}
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
                  disabled={mode === 'show' || _update.status === 'pending'}
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
