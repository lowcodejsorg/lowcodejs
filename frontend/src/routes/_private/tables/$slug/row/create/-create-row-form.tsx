import { useNavigate, useSearch } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import React from 'react';
import { toast } from 'sonner';

import { RowFormFields } from './-create-form';

import { AccessDenied } from '@/components/common/access-denied';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IHTTPExeptionError, ITable } from '@/lib/interfaces';
import { buildCreateRowDefaultValues, buildRowPayload } from '@/lib/table';

interface CreateRowFormProps {
  table: ITable;
}

export function CreateRowForm({
  table,
}: CreateRowFormProps): React.JSX.Element {
  const permissions = useTablePermission(table);

  const { categoryId, categorySlug } = useSearch({
    from: '/_private/tables/$slug/row/create/',
  });

  const sidebar = useSidebar();
  const navigate = useNavigate();

  const fields = React.useMemo(() => {
    return table.fields.filter((f) => !f.trashed);
  }, [table.fields]);

  const form = useAppForm({
    defaultValues: buildCreateRowDefaultValues(fields),
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;
      const _data = buildRowPayload(value, fields);
      await _create.mutateAsync({ slug: table.slug, data: _data });
    },
  });

  function setFieldError(field: string, message: string): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _create = useCreateTableRow({
    onSuccess() {
      toast('Registro criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O registro foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();

      sidebar.setOpen(false);

      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug: table.slug },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as IHTTPExeptionError<
          Record<string, string>
        >;

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PARAMETERS'
        ) {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PAYLOAD_FORMAT'
        ) {
          for (const [field, message] of Object.entries(errorData.errors)) {
            setFieldError(field, message);
          }
          return;
        }

        if (
          errorData?.code === 401 &&
          errorData?.cause === 'AUTHENTICATION_REQUIRED'
        ) {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Permissões insuficientes',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 403 &&
          errorData?.cause === 'OWNER_OR_ADMIN_REQUIRED'
        ) {
          toast('Acesso negado', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Apenas o dono ou administradores da tabela podem realizar esta ação',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'TABLE_PRIVATE') {
          toast('Tabela privada', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'Esta tabela é privada e você não tem acesso',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 403 &&
          errorData?.cause === 'RESTRICTED_CREATE'
        ) {
          toast('Criação restrita', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Apenas o dono ou administradores podem criar registros nesta tabela',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 422 &&
          errorData?.cause === 'UNPROCESSABLE_ENTITY'
        ) {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao criar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao criar o registro', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao criar o registro',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const [prefillApplied, setPrefillApplied] = React.useState(false);

  React.useEffect(() => {
    if (!categoryId || !categorySlug) return;
    if (prefillApplied) return;

    const targetField = fields.find(
      (field) =>
        field.slug === categorySlug && field.type === E_FIELD_TYPE.CATEGORY,
    );

    if (!targetField) return;

    const value = targetField.multiple ? [categoryId] : categoryId;

    form.setFieldValue(categorySlug, value);
    setPrefillApplied(true);
  }, [fields, categoryId, categorySlug, form, prefillApplied]);

  if (!permissions.can('CREATE_ROW')) return <AccessDenied />;

  return (
    <React.Fragment>
      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto relative"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <RowFormFields
          form={form}
          fields={fields}
          disabled={_create.status === 'pending'}
          tableSlug={table.slug}
        />
      </form>

      <div className="shrink-0 border-t p-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                disabled={isSubmitting}
                onClick={() => {
                  sidebar.setOpen(false);
                  navigate({
                    to: '/tables/$slug',
                    replace: true,
                    params: { slug: table.slug },
                  });
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                disabled={!canSubmit}
                onClick={() => form.handleSubmit()}
              >
                {isSubmitting && <Spinner />}
                <span>Criar</span>
              </Button>
            </div>
          )}
        />
      </div>
    </React.Fragment>
  );
}
