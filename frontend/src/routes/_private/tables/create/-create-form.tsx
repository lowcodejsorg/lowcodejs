import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateTable } from '@/integrations/tanstack-query/implementations/use-table-create';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import { ITable, Paginated } from '@/lib/interfaces';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import z from 'zod';

const TableCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres')
    .regex(
      /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
      'O nome não pode conter caracteres especiais',
    ),
});

export function CreateTableForm() {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const _create = useCreateTable({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
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

      queryClient.invalidateQueries({
        queryKey: ['/tables'],
      });

      toast('Tabela criada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi criada com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/tables', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao criar a tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao criar a tabela',
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
    },
    validators: {
      onSubmit: TableCreateSchema,
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;

      await _create.mutateAsync({
        name: value.name.trim(),
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
              if (value.length > 40) {
                return { message: 'Nome deve ter no máximo 40 caracteres' };
              }
              if (
                !/^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/.test(value)
              ) {
                return {
                  message: 'O nome não pode conter caracteres especiais',
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
                  Nome <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={_create.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Digite o nome da tabela"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <FileTextIcon />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <Field className="inline-flex justify-end flex-1 items-end">
          <div className="inline-flex space-x-2 items-end justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-3xs"
              disabled={_create.status === 'pending'}
              onClick={() => {
                navigate({ to: '/tables', search: { page: 1, perPage: 50 } });
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
