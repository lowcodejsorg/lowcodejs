import { useMutation } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';
import z from 'zod';

import {
  CreateFieldFormFields,
  FieldCreateSchema,
  fieldCreateFormDefaultValues,
} from './-create-form';

import type { TreeNode } from '@/components/common/-tree-list';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import type { FIELD_FORMAT } from '@/lib/constant';
import { FIELD_TYPE } from '@/lib/constant';
import type {
  ICategory,
  IField,
  IRow,
  ITable,
  Paginated,
} from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/field/create/')({
  component: RouteComponent,
  validateSearch: z.object({
    'field-type': z
      .enum(Object.keys(FIELD_TYPE) as [string, ...Array<string>])
      .optional(),
    from: z.string().optional(),
  }),
});

function convertTreeNodeToCategory(nodes: Array<TreeNode>): Array<ICategory> {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    children: node.children ? convertTreeNodeToCategory(node.children) : [],
  }));
}

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
  });

  const { 'field-type': defaultFieldType, from } = useSearch({
    from: '/_private/tables/$slug/field/create/',
  });

  const originSlug = from ?? slug;

  const table = useReadTable({ slug });

  const _create = useMutation({
    mutationFn: async (payload: Partial<IField>) => {
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
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((t) => {
              if (t.slug === slug) {
                return {
                  ...t,
                  fields: [...t.fields, response],
                  configuration: {
                    ...t.configuration,
                    fields: {
                      ...t.configuration.fields,
                      orderForm: [
                        ...t.configuration.fields.orderForm,
                        response.slug,
                      ],
                      orderList: [
                        ...t.configuration.fields.orderList,
                        response.slug,
                      ],
                    },
                  },
                };
              }
              return t;
            }),
          };
        },
      );

      queryClient.setQueryData<Paginated<IRow>>(
        [
          '/tables/'.concat(slug).concat('/rows/paginated'),
          slug,
          { page: 1, perPage: 50 },
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

      toast('Campo criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O campo foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug: originSlug },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;
        toast('Erro ao criar o campo', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao criar o campo',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      ...fieldCreateFormDefaultValues,
      type: defaultFieldType ?? '',
    },
    onSubmit: async ({ value }) => {
      const validation = FieldCreateSchema.safeParse(value);
      if (!validation.success) return;

      if (_create.status === 'pending') return;

      const config = value.configuration;
      const hasRelationship = config.relationship.tableId !== '';
      const hasDropdown = config.dropdown.length > 0;
      const hasCategory = config.category.length > 0;

      await _create.mutateAsync({
        name: value.name,
        type: value.type as keyof typeof FIELD_TYPE,
        configuration: {
          required: config.required,
          multiple: config.multiple,
          listing: config.listing,
          filtering: config.filtering,
          format: config.format
            ? (config.format as keyof typeof FIELD_FORMAT)
            : null,
          defaultValue: config.defaultValue || null,
          dropdown: hasDropdown
            ? config.dropdown.map((item) => item.value)
            : null,
          relationship: hasRelationship
            ? {
                table: {
                  _id: config.relationship.tableId,
                  slug: config.relationship.tableSlug,
                },
                field: {
                  _id: config.relationship.fieldId,
                  slug: config.relationship.fieldSlug,
                },
                order: (config.relationship.order || 'asc') as 'asc' | 'desc',
              }
            : null,
          group: null,
          category: hasCategory
            ? convertTreeNodeToCategory(config.category)
            : null,
        },
      });
    },
  });

  // Blocked types for field-group tables
  const blockedTypes =
    table.status === 'success' && table.data.type === 'field-group'
      ? [FIELD_TYPE.FIELD_GROUP, FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION]
      : [];

  const isPending = _create.status === 'pending';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(false);
              navigate({
                to: '/tables/$slug',
                replace: true,
                params: { slug: originSlug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Novo campo</h1>
        </div>
      </div>

      {/* Content */}
      <form
        className="flex-1 flex flex-col min-h-0 overflow-auto"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* @ts-expect-error TanStack Form type instantiation depth issue with nested defaultValues */}
        <CreateFieldFormFields
          form={form}
          isPending={isPending}
          tableSlug={slug}
          blockedTypes={blockedTypes}
          defaultFieldType={defaultFieldType}
        />
      </form>

      {/* Footer */}
      <div className="shrink-0 border-t p-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                className="w-full max-w-3xs"
                disabled={isSubmitting}
                onClick={() => {
                  sidebar.setOpen(false);
                  navigate({
                    to: '/tables/$slug',
                    replace: true,
                    params: { slug: originSlug },
                  });
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                className="w-full max-w-3xs"
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
    </div>
  );
}
