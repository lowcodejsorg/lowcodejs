import { useForm, useStore } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { AlignLeftIcon, CheckIcon, TextIcon } from 'lucide-react';
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
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import { FIELD_FORMAT, FIELD_TYPE } from '@/lib/constant';
import type {
  ICategory,
  IField,
  IRow,
  ITable,
  Paginated,
} from '@/lib/interfaces';
import { cn } from '@/lib/utils';

type RelationshipTableOption = SearchableOption & { slug: string };
type RelationshipFieldOption = SelectOption & { slug: string };

function convertTreeNodeToCategory(nodes: Array<TreeNode>): Array<ICategory> {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    children: node.children ? convertTreeNodeToCategory(node.children) : [],
  }));
}

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

const BLOCKED_FIELD_TYPES = [
  FIELD_TYPE.FIELD_GROUP,
  FIELD_TYPE.REACTION,
  FIELD_TYPE.EVALUATION,
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

interface FieldCreateFormProps {
  tableSlug: string;
  originSlug: string;
}

export function FieldCreateForm({
  tableSlug,
  originSlug,
}: FieldCreateFormProps): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const slug = tableSlug;
  const returnSlug = originSlug;

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
        params: { slug: returnSlug },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PARAMETERS'
        ) {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ?? 'Nome e tipo do campo são obrigatórios',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (
          errorData?.code === 401 &&
          errorData?.cause === 'AUTHENTICATION_REQUIRED'
        ) {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 403 - ACCESS_DENIED
        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ??
              'Permissões insuficientes para criar campos nesta coleção',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 404 - TABLE_NOT_FOUND
        if (errorData?.code === 404 && errorData?.cause === 'TABLE_NOT_FOUND') {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Coleção não encontrada',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 409 - FIELD_ALREADY_EXISTS
        if (
          errorData?.code === 409 &&
          errorData?.cause === 'FIELD_ALREADY_EXISTS'
        ) {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              errorData?.message ?? 'Campo com este nome já existe na coleção',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (
          errorData?.code === 422 &&
          errorData?.cause === 'UNPROCESSABLE_ENTITY'
        ) {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Configuração de campo inválida',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // 500 - SERVER_ERROR
        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao criar o campo', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        // Fallback for unknown errors
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

  const form = useForm({
    defaultValues: {
      name: '',
      type: '' as keyof typeof FIELD_TYPE,
      configuration: {
        required: false,
        multiple: false,
        listing: false,
        filtering: false,
        format: '',
        defaultValue: '',
        dropdown: [] as Array<Option>,
        relationship: {
          table: { _id: [] as Array<RelationshipTableOption>, slug: '' },
          field: { _id: [] as Array<RelationshipFieldOption>, slug: '' },
          order: [] as Array<SelectOption>,
        },
        category: [] as Array<TreeNode>,
        group: null as string | null,
      },
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;

      const config = value.configuration;
      const hasRelationship = config.relationship.table._id.length > 0;
      const hasDropdown = config.dropdown.length > 0;
      const hasCategory = config.category.length > 0;

      await _create.mutateAsync({
        name: value.name,
        type: value.type,
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
                  _id: config.relationship.table._id[0]?.value ?? '',
                  slug: config.relationship.table.slug,
                },
                field: {
                  _id: config.relationship.field._id[0]?.value ?? '',
                  slug: config.relationship.field.slug,
                },
                order: (config.relationship.order[0]?.value ?? 'asc') as
                  | 'asc'
                  | 'desc',
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

  const fieldType = useStore(form.store, (state) => state.values.type);
  const relationshipTableSlug = useStore(
    form.store,
    (state) => state.values.configuration.relationship.table.slug,
  );

  const relationshipTable = useReadTable({
    slug: relationshipTableSlug,
  });

  const relationshipFieldOptions: Array<RelationshipFieldOption> =
    relationshipTable.data?.fields.map((f) => ({
      label: f.name,
      value: f._id,
      slug: f.slug,
    })) ?? [];

  let typeOptions = COLUMN_TYPE_LIST;

  if (table.status === 'success' && table.data.type === 'field-group') {
    typeOptions = typeOptions.filter(
      (item) => !BLOCKED_FIELD_TYPES.includes(item.value),
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <section className="space-y-4 p-2">
        {/* Campo Nome */}
        {/* @ts-expect-error TanStack Form type instantiation depth issue with nested defaultValues */}
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

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Nome <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup data-disabled={_create.status === 'pending'}>
                  <InputGroupInput
                    disabled={_create.status === 'pending'}
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
                    {_create.status === 'pending' ? (
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

        {/* Campo Tipo */}
        <form.Field
          name="type"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Tipo é obrigatório' };
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
                  Tipo <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  disabled={_create.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as keyof typeof FIELD_TYPE);
                  }}
                >
                  <SelectTrigger
                    className={cn(isInvalid && 'border-destructive')}
                  >
                    <SelectValue placeholder="Selecione o tipo do campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((item) => (
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
                    disabled={_create.status === 'pending'}
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

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Valor padrão</FieldLabel>
                  <InputGroup data-disabled={_create.status === 'pending'}>
                    <InputGroupInput
                      disabled={_create.status === 'pending'}
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
                    {_create.status === 'pending' && (
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
                    disabled={_create.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    placeholder="Valor padrão (Se deixar em branco, o campo ficara vazio)"
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
              ): Promise<
                Omit<SearchableResponse, 'items'> & {
                  items: Array<RelationshipTableOption>;
                }
              > => {
                try {
                  return await fetchRelationshipTables(query, page, slug);
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
                    identifier="configuration.relationship.table.paginate"
                    fetchOptions={fetchWrapper}
                    selectedValues={field.state.value ?? []}
                    onChange={(options) => {
                      field.handleChange(
                        options as Array<RelationshipTableOption>,
                      );
                      const [option] =
                        options as Array<RelationshipTableOption>;
                      if (option.slug) {
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
                    disabled={relationshipTable.status === 'pending'}
                    placeholder="Selecione um campo"
                    selectedValues={field.state.value ?? []}
                    onChange={(options) => {
                      field.handleChange(
                        options as Array<RelationshipFieldOption>,
                      );
                      const [option] =
                        options as Array<RelationshipFieldOption>;
                      if (option.slug) {
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
                      field.handleChange(option.value);
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
                    initialData={field.state.value ?? []}
                    onChange={(data) => field.handleChange(data)}
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
                <FieldLabel className="text-base">
                  Exibir na listagem
                </FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Exibir este campo na listagem?
                </p>
              </div>
              <div className="inline-flex space-x-2">
                <span className="text-sm">Não</span>
                <Switch
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
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                  <span className="text-sm">Sim</span>
                </div>
              </Field>
            )}
          </form.Field>
        )}

        {/* Botões */}
        <Field className="inline-flex justify-end flex-1 items-end">
          <div className="inline-flex space-x-2 items-end justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-3xs"
              disabled={_create.status === 'pending'}
              onClick={() => {
                sidebar.setOpen(false);
                navigate({
                  to: '/tables/$slug',
                  replace: true,
                  params: { slug: returnSlug },
                });
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
