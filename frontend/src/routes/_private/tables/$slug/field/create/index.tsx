import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CreateTableFieldForm } from './-create-form';

import type { Option } from '@/components/common/-multi-selector';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import { FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, ITable, Paginated } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/field/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
  });

  const form = useForm();

  const create = useMutation({
    mutationFn: async function (payload: Partial<IField>) {
      const route = '/tables/'.concat(slug).concat('/fields');
      const response = await API.post<IField>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(slug), slug],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: [...old.fields, response],
            configuration: {
              ...old.configuration,
              fields: {
                ...old.configuration.fields,
                orderForm: [
                  ...old.configuration.fields.orderForm,
                  response.slug,
                ],
                orderList: [
                  ...old.configuration.fields.orderList,
                  response.slug,
                ],
              },
            },
          };
        },
      );

      queryClient.setQueryData<Paginated<ITable>>(
        [
          '/tables/paginated',
          {
            page: 1,
            perPage: 50,
          },
        ],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((table) => {
              if (table.slug === slug) {
                return {
                  ...table,
                  fields: [...table.fields, response],
                  configuration: {
                    ...table.configuration,
                    fields: {
                      ...table.configuration.fields,
                      orderForm: [
                        ...table.configuration.fields.orderForm,
                        response.slug,
                      ],
                      orderList: [
                        ...table.configuration.fields.orderList,
                        response.slug,
                      ],
                    },
                  },
                };
              }
              return table;
            }),
          };
        },
      );

      queryClient.setQueryData<Paginated<IRow>>(
        [
          '/tables/'.concat(slug).concat('/rows/paginated'),
          slug,
          {
            page: 1,
            perPage: 50,
          },
        ],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((row) => ({
              ...row,
              [response.slug]: null,
            })),
          };
        },
      );
      GoBack();
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;
      }

      console.error(error);
      toast('Erro ao criar o campo', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Erro ao criar o campo',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const onSubmit = form.handleSubmit(async function (data): Promise<void> {
    if (create.status === 'pending') return;

    await create.mutateAsync({
      name: data.name,
      type: data.type || FIELD_TYPE.TEXT_SHORT,
      configuration: {
        required: data.configuration?.required ?? false,
        multiple: data.configuration?.multiple ?? false,
        listing: data.configuration?.listing ?? false,
        filtering: data.configuration?.filtering ?? false,
        format: null,
        defaultValue: data.configuration?.defaultValue ?? null,
        dropdown: null,
        relationship: null,
        group: data.configuration?.group ?? null,
        category: data.configuration?.category ?? null,

        ...(data.configuration?.format && {
          format: data.configuration?.format,
        }),

        ...(data.configuration?.dropdown && {
          dropdown: data.configuration?.dropdown?.map(
            (item: Option) => item.value,
          ),
        }),

        ...(data.configuration?.relationship && {
          relationship: {
            ...data.configuration?.relationship,
            table: {
              ...data.configuration?.relationship?.table,
              _id: data.configuration?.relationship?.table?._id?.[0]?.value,
            },
            field: {
              ...data.configuration?.relationship?.field,
              _id: data.configuration?.relationship?.field?._id?.[0]?.value,
            },
            order: data.configuration?.relationship?.order?.[0]?.value,
          },
        }),
      },
    });
  });

  function GoBack(): void {
    sidebar.setOpen(false);
    router.navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col h-full overflow-hidden"
        onSubmit={onSubmit}
      >
        {/* Header */}
        <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
          <div className="inline-flex items-center space-x-2">
            <Button
              variant="ghost"
              type="button"
              size="icon-sm"
              onClick={GoBack}
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="text-xl font-medium">Nova campo</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <CreateTableFieldForm />
        </div>

        <div className="shrink-0 border-t p-2">
          <div className="inline-flex space-x-2 items-end justify-end w-full">
            <Button
              className="w-full max-w-3xs"
              type="submit"
              disabled={create.status === 'pending'}
            >
              {create.status === 'pending' && <Spinner />}
              <span>Adicionar</span>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
