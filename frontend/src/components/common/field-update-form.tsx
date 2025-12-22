import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { AlignLeftIcon, CheckIcon, TextIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import type { Option } from '@/components/common/-multi-selector';
import { MultipleSelector } from '@/components/common/-multi-selector';
import type {
  SearchableOption,
  SearchableResponse,
} from '@/components/common/-searchable-select';
import { SearchableSelect } from '@/components/common/-searchable-select';
import type { SelectOption } from '@/components/common/-simple-select';
import { SimpleSelect } from '@/components/common/-simple-select';
import type { TreeNode } from '@/components/common/-tree-list';
import { TreeEditor } from '@/components/common/-tree-node';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import { FIELD_FORMAT, FIELD_TYPE } from '@/lib/constant';
import type { IField, ITable, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

type FieldUpdateFormProps = {
  data: IField;
  tableSlug: string;
  originSlug?: string;
};

type RelationshipTableOption = SearchableOption & { slug: string };
type RelationshipFieldOption = SelectOption & { slug: string };

const COLUMN_TYPE_LIST = [
  { label: 'Texto', value: FIELD_TYPE.TEXT_SHORT },
  { label: 'Texto longo', value: FIELD_TYPE.TEXT_LONG },
  { label: 'Dropdown', value: FIELD_TYPE.DROPDOWN },
  { label: 'Arquivo', value: FIELD_TYPE.FILE },
  { label: 'Data', value: FIELD_TYPE.DATE },
  { label: 'Relacionamento', value: FIELD_TYPE.RELATIONSHIP },
  { label: 'Grupo de campos', value: FIELD_TYPE.FIELD_GROUP },
  { label: 'Árvore', value: FIELD_TYPE.CATEGORY },
  { label: 'Reação', value: FIELD_TYPE.REACTION },
  { label: 'Avaliação', value: FIELD_TYPE.EVALUATION },
];

const TEXT_SHORT_FORMAT_LIST = [
  { label: 'Alfanumérico', value: FIELD_FORMAT.ALPHA_NUMERIC },
  { label: 'Inteiro', value: FIELD_FORMAT.INTEGER },
  { label: 'Decimal', value: FIELD_FORMAT.DECIMAL },
  { label: 'URL', value: FIELD_FORMAT.URL },
  { label: 'E-mail', value: FIELD_FORMAT.EMAIL },
];

const DATE_FORMAT_LIST = [
  { label: 'DD/MM/AAAA', value: FIELD_FORMAT['DD_MM_YYYY'] },
  { label: 'MM/DD/AAAA', value: FIELD_FORMAT['MM_DD_YYYY'] },
  { label: 'AAAA/MM/DD', value: FIELD_FORMAT['YYYY_MM_DD'] },
  { label: 'DD/MM/AAAA hh:mm:ss', value: FIELD_FORMAT['DD_MM_YYYY_HH_MM_SS'] },
  { label: 'MM/DD/AAAA hh:mm:ss', value: FIELD_FORMAT['MM_DD_YYYY_HH_MM_SS'] },
  { label: 'AAAA/MM/DD hh:mm:ss', value: FIELD_FORMAT['YYYY_MM_DD_HH_MM_SS'] },
  { label: 'DD-MM-AAAA', value: FIELD_FORMAT['DD_MM_YYYY_DASH'] },
  { label: 'MM-DD-AAAA', value: FIELD_FORMAT['MM_DD_YYYY_DASH'] },
  { label: 'AAAA-MM-DD', value: FIELD_FORMAT['YYYY_MM_DD_DASH'] },
  {
    label: 'DD-MM-AAAA hh:mm:ss',
    value: FIELD_FORMAT['DD_MM_YYYY_HH_MM_SS_DASH'],
  },
  {
    label: 'MM-DD-AAAA hh:mm:ss',
    value: FIELD_FORMAT['MM_DD_YYYY_HH_MM_SS_DASH'],
  },
  {
    label: 'AAAA-MM-DD hh:mm:ss',
    value: FIELD_FORMAT['YYYY_MM_DD_HH_MM_SS_DASH'],
  },
];

const ORDER_LIST = [
  { label: 'Ascendente', value: 'asc' },
  { label: 'Descendente', value: 'desc' },
];

async function fetchRelationshipTables(
  query: string,
  page: number,
  tableSlug: string,
): Promise<
  Omit<SearchableResponse, 'items'> & { items: Array<RelationshipTableOption> }
> {
  const response = await API.get<Paginated<ITable>>('/tables/paginated', {
    params: {
      page,
      perPage: 10,
      ...(query && { search: query }),
    },
  });

  return {
    items: response.data.data
      .filter((item) => item.slug !== tableSlug)
      .map((item) => ({
        value: item._id,
        label: item.name.toString(),
        slug: item.slug,
      })),
    nextPage: page < response.data.meta.lastPage ? page + 1 : null,
    totalItems: response.data.meta.total,
  };
}

export function FieldUpdateForm({
  data,
  tableSlug,
}: FieldUpdateFormProps): React.JSX.Element {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useMutation({
    mutationFn: async (
      payload: Partial<IField> & { trashed?: boolean; trashedAt?: string | null },
    ) => {
      const route = '/tables/'
        .concat(tableSlug)
        .concat('/fields/')
        .concat(data._id);
      const response = await API.put<IField>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<IField>(
        [
          '/tables/'.concat(tableSlug).concat('/fields/').concat(response._id),
          response._id,
        ],
        response,
      );

      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(tableSlug), tableSlug],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            fields: old.fields.map((f) => {
              if (f._id === response._id) {
                return response;
              }
              return f;
            }),
          };
        },
      );

      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((table) => {
              if (table.slug === tableSlug) {
                return {
                  ...table,
                  fields: table.fields.map((f) => {
                    if (f._id === response._id) {
                      return response;
                    }
                    return f;
                  }),
                };
              }
              return table;
            }),
          };
        },
      );

      // Check if the trashed status changed
      const wasTrashed = Boolean((data as IField & { trashed?: boolean }).trashed);
      const isTrashed = Boolean(response.trashed);

      if (!wasTrashed && isTrashed) {
        // Field was sent to trash
        toast('Campo enviado para lixeira', {
          className: '!bg-amber-600 !text-white !border-amber-600',
          description:
            'O campo foi enviado para a lixeira. Para restaurá-lo, acesse o gerenciamento de campos.',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      } else if (wasTrashed && !isTrashed) {
        // Field was restored from trash
        toast('Campo restaurado', {
          className: '!bg-green-600 !text-white !border-green-600',
          description:
            'O campo foi restaurado. Para enviá-lo à lixeira, acesse o gerenciamento de campos.',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      } else {
        // Normal update
        toast('Campo atualizado', {
          className: '!bg-green-600 !text-white !border-green-600',
          description: 'Os dados do campo foram atualizados com sucesso',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (errorData?.code === 400 && errorData?.cause === 'INVALID_PARAMETERS') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (errorData?.code === 401 && errorData?.cause === 'AUTHENTICATION_REQUIRED') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 403 - ACCESS_DENIED
        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ?? 'Permissões insuficientes para atualizar este campo',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 404 - FIELD_NOT_FOUND
        if (errorData?.code === 404 && errorData?.cause === 'FIELD_NOT_FOUND') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Campo não encontrado',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 409 - LAST_ACTIVE_FIELD
        if (errorData?.code === 409 && errorData?.cause === 'LAST_ACTIVE_FIELD') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'Último campo ativo, não pode ser enviado para a lixeira',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 409 - FIELD_ALREADY_EXISTS
        if (errorData?.code === 409 && errorData?.cause === 'FIELD_ALREADY_EXISTS') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Já existe um campo com este nome',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 409 - FIELD_IN_USE
        if (errorData?.code === 409 && errorData?.cause === 'FIELD_IN_USE') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ??
              'Não é possível alterar o tipo do campo: o campo contém dados',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (errorData?.code === 422 && errorData?.cause === 'UNPROCESSABLE_ENTITY') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Configuração de campo inválida',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 500 - SERVER_ERROR
        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao atualizar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // Fallback for unknown errors
        toast('Erro ao atualizar o campo', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar o campo',
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
      type: data.type,
      configuration: {
        required: data.configuration.required,
        multiple: data.configuration.multiple,
        listing: data.configuration.listing,
        filtering: data.configuration.filtering,
        format: data.configuration.format ?? '',
        defaultValue: data.configuration.defaultValue ?? '',
        dropdown:
          data.configuration.dropdown?.map((d) => ({ value: d, label: d })) ??
          ([] as Array<Option>),
        relationship: {
          table: {
            _id: data.configuration.relationship?.table._id
              ? ([
                  {
                    value: data.configuration.relationship.table._id,
                    label: '',
                    slug: data.configuration.relationship.table.slug,
                  },
                ] as Array<RelationshipTableOption>)
              : ([] as Array<RelationshipTableOption>),
            slug: data.configuration.relationship?.table.slug ?? '',
          },
          field: {
            _id: data.configuration.relationship?.field._id
              ? ([
                  {
                    value: data.configuration.relationship.field._id,
                    label: '',
                    slug: data.configuration.relationship.field.slug,
                  },
                ] as Array<RelationshipFieldOption>)
              : ([] as Array<RelationshipFieldOption>),
            slug: data.configuration.relationship?.field.slug ?? '',
          },
          order: data.configuration.relationship?.order
            ? ([
                ORDER_LIST.find(
                  (o) => o.value === data.configuration.relationship?.order,
                ),
              ].filter(Boolean) as Array<SelectOption>)
            : ([] as Array<SelectOption>),
        },
        category: (data.configuration.category ?? []) as Array<TreeNode>,
        group: null as string | null,
      },
      trashed: Boolean((data as IField & { trashed?: boolean }).trashed),
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        name: value.name,
        type: value.type,
        configuration: {
          required: value.configuration.required,
          multiple: value.configuration.multiple,
          listing: value.configuration.listing,
          filtering: value.configuration.filtering,
          format: value.configuration.format || null,
          defaultValue: value.configuration.defaultValue || null,
          dropdown:
            value.configuration.dropdown.length > 0
              ? value.configuration.dropdown.map((item) => item.value)
              : null,
          relationship:
            value.configuration.relationship.table._id.length > 0
              ? {
                  table: {
                    _id: value.configuration.relationship.table._id[0]?.value,
                    slug: value.configuration.relationship.table.slug,
                  },
                  field: {
                    _id: value.configuration.relationship.field._id[0]?.value,
                    slug: value.configuration.relationship.field.slug,
                  },
                  order: value.configuration.relationship.order[0]
                    ?.value as 'asc' | 'desc',
                }
              : null,
          category:
            value.configuration.category.length > 0
              ? (value.configuration.category as unknown as IField['configuration']['category'])
              : null,
          group: value.configuration.group
            ? ({ _id: value.configuration.group, slug: '' } as IField['configuration']['group'])
            : null,
        },
        trashed: value.trashed,
        trashedAt: value.trashed ? new Date().toISOString() : null,
      });
    },
  });

  const fieldType = useStore(form.store, (state) => state.values.type);
  const relationshipTableSlug = useStore(
    form.store,
    (state) => state.values.configuration.relationship.table.slug,
  );

  const relationshipTable = useQuery({
    queryKey: ['/tables/'.concat(relationshipTableSlug), relationshipTableSlug],
    queryFn: async () => {
      const route = '/tables/'.concat(relationshipTableSlug);
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(relationshipTableSlug),
  });

  const relationshipFieldOptions: Array<RelationshipFieldOption> =
    relationshipTable?.data?.fields?.map((f) => ({
      label: f.name,
      value: f._id,
      slug: f.slug,
    })) ?? [];

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
                return { message: 'O nome deve ter no máximo 40 caracteres' };
              }
              return undefined;
            },
          }}
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            const charCount = field.state.value?.length ?? 0;
            const isValid =
              field.state.meta.isTouched && field.state.meta.isValid;
            const isDisabled = mode === 'show' || _update.status === 'pending';

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Nome <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup data-disabled={isDisabled}>
                  <InputGroupInput
                    disabled={isDisabled}
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Nome do campo"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <TextIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    {_update.status === 'pending' ? (
                      <Spinner />
                    ) : isValid ? (
                      <CheckIcon className="size-4 text-green-600" />
                    ) : (
                      <InputGroupText
                        className={cn(
                          'text-xs',
                          charCount > 40 && 'text-destructive',
                        )}
                      >
                        {charCount}/40
                      </InputGroupText>
                    )}
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Tipo (disabled) */}
        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
              <Select
                disabled
                value={field.state.value}
              >
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Tipo do campo" />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPE_LIST.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Campo Formato (TEXT_SHORT) */}
        {fieldType === FIELD_TYPE.TEXT_SHORT && (
          <form.Field
            name="configuration.format"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Formato é obrigatório' };
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
                    Formato <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    disabled={mode === 'show' || _update.status === 'pending'}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger
                      className={cn(isInvalid && 'border-destructive')}
                    >
                      <SelectValue placeholder="Selecione um formato para o campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEXT_SHORT_FORMAT_LIST.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Valor Padrão (TEXT_SHORT) */}
        {fieldType === FIELD_TYPE.TEXT_SHORT && (
          <form.Field name="configuration.defaultValue">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const isDisabled =
                mode === 'show' || _update.status === 'pending';

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Valor padrão</FieldLabel>
                  <InputGroup data-disabled={isDisabled}>
                    <InputGroupInput
                      disabled={isDisabled}
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="Valor padrão (deixe em branco se não houver)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    <InputGroupAddon>
                      <AlignLeftIcon className="size-4" />
                    </InputGroupAddon>
                    {_update.status === 'pending' && (
                      <InputGroupAddon align="inline-end">
                        <Spinner />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Valor Padrão (TEXT_LONG) */}
        {fieldType === FIELD_TYPE.TEXT_LONG && (
          <form.Field name="configuration.defaultValue">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Valor Padrão</FieldLabel>
                  <Textarea
                    disabled={mode === 'show' || _update.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    placeholder="Valor padrão (Se deixar em branco, o campo ficará vazio)"
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
          </form.Field>
        )}

        {/* Campo Dropdown */}
        {fieldType === FIELD_TYPE.DROPDOWN && (
          <form.Field
            name="configuration.dropdown"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Adicione ao menos uma opção' };
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
                    Opções <span className="text-destructive">*</span>
                  </FieldLabel>
                  <MultipleSelector
                    disabled={mode === 'show' || _update.status === 'pending'}
                    onChange={(options) => field.handleChange(options)}
                    value={field.state.value ?? []}
                    creatable
                    triggerSearchOnFocus
                    allowReorder={true}
                    placeholder="Escreva e adicione"
                    emptyIndicator={null}
                    className={cn('w-full', isInvalid && 'border-destructive')}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Tabela de Relacionamento */}
        {fieldType === FIELD_TYPE.RELATIONSHIP && (
          <form.Field
            name="configuration.relationship.table._id"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Tabela de relacionamento é obrigatório' };
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              const fetchWrapper = async (
                query: string,
                page: number,
              ): Promise<SearchableResponse> => {
                try {
                  return await fetchRelationshipTables(query, page, tableSlug);
                } catch (error) {
                  console.error('Error fetching options:', error);
                  return { items: [], nextPage: null, totalItems: 0 };
                }
              };

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tabela de relacionamento{' '}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <SearchableSelect
                    disabled={mode === 'show' || _update.status === 'pending'}
                    identifier="configuration.relationship.table.paginate"
                    fetchOptions={fetchWrapper}
                    selectedValues={field.state.value ?? []}
                    onChange={(options) => {
                      field.handleChange(
                        options as Array<RelationshipTableOption>,
                      );
                      const [option] =
                        options as Array<RelationshipTableOption>;
                      if (option?.slug) {
                        form.setFieldValue(
                          'configuration.relationship.table.slug',
                          option.slug,
                        );
                        form.setFieldValue(
                          'configuration.relationship.field._id',
                          [],
                        );
                        form.setFieldValue(
                          'configuration.relationship.field.slug',
                          '',
                        );
                      }
                    }}
                    isMultiple={false}
                    placeholder="Selecione uma tabela de relacionamento"
                    maxDisplayItems={1}
                    className={cn(isInvalid && 'border-destructive')}
                    prioritizeSelected
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo de Relacionamento (coluna) */}
        {fieldType === FIELD_TYPE.RELATIONSHIP && relationshipTableSlug && (
          <form.Field
            name="configuration.relationship.field._id"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Campo é obrigatório' };
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
                    Campo de relacionamento{' '}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <SimpleSelect
                    disabled={
                      mode === 'show' ||
                      _update.status === 'pending' ||
                      relationshipTable.status === 'pending'
                    }
                    placeholder="Selecione um campo"
                    selectedValues={field.state.value ?? []}
                    onChange={(options) => {
                      field.handleChange(
                        options as Array<RelationshipFieldOption>,
                      );
                      const [option] =
                        options as Array<RelationshipFieldOption>;
                      if (option?.slug) {
                        form.setFieldValue(
                          'configuration.relationship.field.slug',
                          option.slug,
                        );
                      }
                    }}
                    options={relationshipFieldOptions}
                    className={cn('w-full', isInvalid && 'border-destructive')}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Ordem (Relacionamento) */}
        {fieldType === FIELD_TYPE.RELATIONSHIP && (
          <form.Field
            name="configuration.relationship.order"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Ordem é obrigatória' };
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
                    Ordem <span className="text-destructive">*</span>
                  </FieldLabel>
                  <SimpleSelect
                    disabled={mode === 'show' || _update.status === 'pending'}
                    placeholder="Selecione uma ordem"
                    selectedValues={field.state.value ?? []}
                    onChange={(options) => field.handleChange(options)}
                    options={ORDER_LIST}
                    className={cn('w-full', isInvalid && 'border-destructive')}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Formato Data */}
        {fieldType === FIELD_TYPE.DATE && (
          <form.Field
            name="configuration.format"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Formato da data é obrigatório' };
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
                    Formato da data <span className="text-destructive">*</span>
                  </FieldLabel>
                  <SimpleSelect
                    disabled={mode === 'show' || _update.status === 'pending'}
                    placeholder="Formato da data"
                    selectedValues={
                      field.state.value
                        ? [
                            DATE_FORMAT_LIST.find(
                              (f) => f.value === field.state.value,
                            ) ?? {
                              value: field.state.value,
                              label: field.state.value,
                            },
                          ]
                        : []
                    }
                    onChange={(options) => {
                      const [option] = options;
                      field.handleChange(option?.value ?? '');
                    }}
                    options={DATE_FORMAT_LIST}
                    className={cn('w-full', isInvalid && 'border-destructive')}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Categoria (Tree) */}
        {fieldType === FIELD_TYPE.CATEGORY && (
          <form.Field
            name="configuration.category"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Estrutura da categoria é obrigatória' };
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
                    Estrutura da categoria{' '}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <TreeEditor
                    disabled={mode === 'show' || _update.status === 'pending'}
                    initialData={field.state.value ?? []}
                    onChange={(newData) => field.handleChange(newData)}
                    className={cn(isInvalid && 'border-destructive')}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo Múltiplos */}
        {[
          FIELD_TYPE.DROPDOWN,
          FIELD_TYPE.FILE,
          FIELD_TYPE.RELATIONSHIP,
          FIELD_TYPE.FIELD_GROUP,
          FIELD_TYPE.CATEGORY,
        ].includes(fieldType) && (
          <form.Field name="configuration.multiple">
            {(field) => (
              <Field className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FieldLabel className="text-base">
                    Permitir múltiplos
                  </FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Este campo deve permitir múltiplos valores?
                  </p>
                </div>
                <div className="inline-flex space-x-2">
                  <span className="text-sm">Não</span>
                  <Switch
                    disabled={mode === 'show' || _update.status === 'pending'}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                  <span className="text-sm">Sim</span>
                </div>
              </Field>
            )}
          </form.Field>
        )}

        {/* Campo Filtro */}
        {![FIELD_TYPE.REACTION, FIELD_TYPE.FILE].includes(fieldType) && (
          <form.Field name="configuration.filtering">
            {(field) => (
              <Field className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FieldLabel className="text-base">Usar no filtro</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Usar este campo para filtrar os dados?
                  </p>
                </div>
                <div className="inline-flex space-x-2">
                  <span className="text-sm">Não</span>
                  <Switch
                    disabled={mode === 'show' || _update.status === 'pending'}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                  <span className="text-sm">Sim</span>
                </div>
              </Field>
            )}
          </form.Field>
        )}

        {/* Campo Listagem */}
        <form.Field name="configuration.listing">
          {(field) => (
            <Field className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FieldLabel className="text-base">Exibir na listagem</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Exibir este campo na listagem?
                </p>
              </div>
              <div className="inline-flex space-x-2">
                <span className="text-sm">Não</span>
                <Switch
                  disabled={mode === 'show' || _update.status === 'pending'}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <span className="text-sm">Sim</span>
              </div>
            </Field>
          )}
        </form.Field>

        {/* Campo Obrigatoriedade */}
        {![FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION].includes(fieldType) && (
          <form.Field name="configuration.required">
            {(field) => (
              <Field className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FieldLabel className="text-base">Obrigatoriedade</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Este campo é obrigatório?
                  </p>
                </div>
                <div className="inline-flex space-x-2">
                  <span className="text-sm">Não</span>
                  <Switch
                    disabled={mode === 'show' || _update.status === 'pending'}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                  <span className="text-sm">Sim</span>
                </div>
              </Field>
            )}
          </form.Field>
        )}

        {/* Campo Lixeira */}
        <form.Field name="trashed">
          {(field) => (
            <Field className="flex flex-row items-center justify-between rounded-lg border p-3 border-destructive/50">
              <div className="space-y-0.5">
                <FieldLabel className="text-base">Enviar para lixeira</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Enviar este campo para a lixeira?
                </p>
              </div>
              <div className="inline-flex space-x-2">
                <span className="text-sm">Não</span>
                <Switch
                  disabled={mode === 'show' || _update.status === 'pending'}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <span className="text-sm">Sim</span>
              </div>
            </Field>
          )}
        </form.Field>

        {/* Botões */}
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
