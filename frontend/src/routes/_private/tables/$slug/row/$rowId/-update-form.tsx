import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, TextIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import type { Option } from '@/components/common/-multi-selector';
import { MultipleSelector } from '@/components/common/-multi-selector';
import type {
  SearchableOption,
  SearchableResponse,
} from '@/components/common/-searchable-select';
import { SearchableSelect } from '@/components/common/-searchable-select';
import { SimpleSelect } from '@/components/common/-simple-select';
import type { TreeNode } from '@/components/common/-tree-list';
import { TreeList } from '@/components/common/-tree-list';
import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import { FIELD_TYPE } from '@/lib/constant';
import type {
  ICategory,
  IField,
  IRow,
  IStorage,
  ITable,
  Paginated,
} from '@/lib/interfaces';
import { cn } from '@/lib/utils';

type UpdateRowFormProps = {
  data: IRow;
  table: ITable;
};

// Helper functions
function convertCategoriesToTreeNodes(
  categories: Array<ICategory>,
): Array<TreeNode> {
  return categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    children:
      cat.children.length > 0 ? convertCategoriesToTreeNodes(cat.children) : [],
  }));
}

function findCategoryLabel(
  categoryId: string,
  categories: Array<ICategory>,
): string | null {
  for (const cat of categories) {
    if (cat.id === categoryId) return cat.label;
    if (cat.children.length > 0) {
      const found = findCategoryLabel(categoryId, cat.children);
      if (found) return found;
    }
  }
  return null;
}

function getDateFormatString(dateFormat: string | null): string {
  switch (dateFormat) {
    case 'DD_MM_YYYY':
    case 'DD_MM_YYYY_DASH':
      return 'dd/MM/yyyy';
    case 'MM_DD_YYYY':
    case 'MM_DD_YYYY_DASH':
      return 'MM/dd/yyyy';
    case 'YYYY_MM_DD':
    case 'YYYY_MM_DD_DASH':
      return 'yyyy/MM/dd';
    case 'DD_MM_YYYY_HH_MM_SS':
    case 'DD_MM_YYYY_HH_MM_SS_DASH':
      return 'dd/MM/yyyy HH:mm:ss';
    case 'MM_DD_YYYY_HH_MM_SS':
    case 'MM_DD_YYYY_HH_MM_SS_DASH':
      return 'MM/dd/yyyy HH:mm:ss';
    case 'YYYY_MM_DD_HH_MM_SS':
    case 'YYYY_MM_DD_HH_MM_SS_DASH':
      return 'yyyy/MM/dd HH:mm:ss';
    default:
      return 'dd/MM/yyyy';
  }
}

// Build default values from existing row data
function buildDefaultValues(
  data: IRow,
  fields: Array<IField>,
): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    const existingValue = data[field.slug];

    switch (field.type) {
      case FIELD_TYPE.TEXT_SHORT:
      case FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = existingValue ?? '';
        break;
      case FIELD_TYPE.DROPDOWN:
        if (field.configuration.multiple) {
          const values = (existingValue as Array<string>) ?? [];
          defaults[field.slug] = values.map((v) => ({ value: v, label: v }));
        } else {
          defaults[field.slug] = existingValue ?? '';
        }
        break;
      case FIELD_TYPE.DATE:
        defaults[field.slug] = existingValue ?? '';
        break;
      case FIELD_TYPE.FILE:
        defaults[field.slug] = {
          files: [] as Array<File>,
          storages: (existingValue as Array<IStorage>) ?? [],
        };
        break;
      case FIELD_TYPE.RELATIONSHIP:
        if (field.configuration.multiple) {
          const values = (existingValue as Array<{ _id: string }>) ?? [];
          defaults[field.slug] = values.map((v) => ({
            value: v._id,
            label: v._id,
          }));
        } else {
          const value = existingValue as { _id: string } | null;
          defaults[field.slug] = value
            ? [{ value: value._id, label: value._id }]
            : [];
        }
        break;
      case FIELD_TYPE.CATEGORY:
        defaults[field.slug] = existingValue ?? (field.configuration.multiple ? [] : '');
        break;
      case FIELD_TYPE.FIELD_GROUP:
        defaults[field.slug] = existingValue ?? (field.configuration.multiple ? [] : {});
        break;
      default:
        defaults[field.slug] = existingValue ?? '';
    }
  }

  return defaults;
}

// Build payload for API
function buildPayload(
  values: Record<string, any>,
  fields: Array<IField>,
): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed) continue;

    const value = values[field.slug];

    switch (field.type) {
      case FIELD_TYPE.TEXT_SHORT:
      case FIELD_TYPE.TEXT_LONG:
        payload[field.slug] = value || null;
        break;
      case FIELD_TYPE.DROPDOWN:
        if (field.configuration.multiple) {
          payload[field.slug] = (value as Array<Option>).map(
            (opt) => opt.value,
          );
        } else {
          payload[field.slug] = value || null;
        }
        break;
      case FIELD_TYPE.DATE:
        payload[field.slug] = value || null;
        break;
      case FIELD_TYPE.FILE: {
        const fileValue = value as {
          files: Array<File>;
          storages: Array<IStorage>;
        };
        if (field.configuration.multiple) {
          payload[field.slug] = fileValue.storages.map((s) => s._id);
        } else {
          payload[field.slug] = fileValue.storages[0]?._id ?? null;
        }
        break;
      }
      case FIELD_TYPE.RELATIONSHIP: {
        const relValue = value as Array<SearchableOption>;
        if (field.configuration.multiple) {
          payload[field.slug] = relValue.map((opt) => opt.value);
        } else {
          payload[field.slug] = relValue[0]?.value ?? null;
        }
        break;
      }
      case FIELD_TYPE.CATEGORY:
        if (field.configuration.multiple) {
          payload[field.slug] = value;
        } else {
          payload[field.slug] = value || null;
        }
        break;
      case FIELD_TYPE.FIELD_GROUP:
        payload[field.slug] = value || null;
        break;
      default:
        payload[field.slug] = value || null;
    }
  }

  return payload;
}

export function UpdateRowForm({
  data,
  table,
}: UpdateRowFormProps): React.JSX.Element {
  const { queryClient } = getContext();
  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const activeFields = React.useMemo(() => {
    return table.fields.filter((f) => !f.trashed);
  }, [table.fields]);

  const _update = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const route = '/tables/'
        .concat(table.slug)
        .concat('/rows/')
        .concat(data._id);
      const response = await API.put<IRow>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      queryClient.setQueryData<IRow>(
        [
          '/tables/'.concat(table.slug).concat('/rows/').concat(response._id),
          response._id,
        ],
        response,
      );

      queryClient.setQueryData<Paginated<IRow>>(
        [
          '/tables/'.concat(table.slug).concat('/rows/paginated'),
          table.slug,
          { page: 1, perPage: 50 },
        ],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((row) => {
              if (row._id === response._id) {
                return response;
              }
              return row;
            }),
          };
        },
      );

      toast('Registro atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O registro foi atualizado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PARAMETERS'
        ) {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 401 &&
          errorData?.cause === 'AUTHENTICATION_REQUIRED'
        ) {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Permissões insuficientes',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 404 && errorData?.cause === 'ROW_NOT_FOUND') {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Registro não encontrado',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 422 &&
          errorData?.cause === 'UNPROCESSABLE_ENTITY'
        ) {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao atualizar o registro', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar o registro',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
    },
  });

  const form = useForm({
    defaultValues: buildDefaultValues(data, activeFields),
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      const payload = buildPayload(value, activeFields);
      await _update.mutateAsync(payload);
    },
  });

  const isDisabled = mode === 'show' || _update.status === 'pending';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <section className="space-y-4 p-2">
        {activeFields.map((field) => (
          <RowFieldInput
            key={field._id}
            field={field}
            form={form}
            disabled={isDisabled}
            tableSlug={table.slug}
          />
        ))}

        <Field className="inline-flex justify-end flex-1 items-end">
          {mode === 'show' && (
            <Button
              type="button"
              className="w-full max-w-3xs"
              onClick={() => setMode('edit')}
            >
              <span>Editar</span>
            </Button>
          )}

          {mode === 'edit' && (
            <div className="inline-flex space-x-2 items-end justify-end">
              <Button
                type="button"
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

// Component for rendering a single field based on its type
function RowFieldInput({
  field,
  form,
  disabled,
  tableSlug,
}: {
  field: IField;
  form: any;
  disabled: boolean;
  tableSlug: string;
}): React.JSX.Element | null {
  // Skip non-editable field types
  if (
    field.type === FIELD_TYPE.REACTION ||
    field.type === FIELD_TYPE.EVALUATION
  ) {
    return null;
  }

  const isRequired = field.configuration.required;

  return (
    <form.Field
      name={field.slug}
      validators={
        isRequired
          ? {
              onBlur: ({
                value,
              }: {
                value: any;
              }): { message: string } | undefined => {
                if (value === null || value === undefined || value === '') {
                  return { message: `${field.name} é obrigatório` };
                }
                if (Array.isArray(value) && value.length === 0) {
                  return { message: `${field.name} é obrigatório` };
                }
                if (typeof value === 'object' && 'storages' in value) {
                  const storageValue = value as { storages: Array<IStorage> };
                  if (storageValue.storages.length === 0) {
                    return { message: `${field.name} é obrigatório` };
                  }
                }
                return undefined;
              },
            }
          : undefined
      }
    >
      {(formField: any) => {
        const isInvalid =
          formField.state.meta.isTouched && !formField.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={formField.name}>
              {field.name}
              {isRequired && <span className="text-destructive"> *</span>}
            </FieldLabel>
            <RowFieldRenderer
              field={field}
              formField={formField}
              disabled={disabled}
              tableSlug={tableSlug}
            />
            {isInvalid && <FieldError errors={formField.state.meta.errors} />}
          </Field>
        );
      }}
    </form.Field>
  );
}

// Render the appropriate input component based on field type
function RowFieldRenderer({
  field,
  formField,
  disabled,
  tableSlug,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
  tableSlug: string;
}): React.JSX.Element | null {
  switch (field.type) {
    case FIELD_TYPE.TEXT_SHORT:
      return (
        <RowTextShort
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.TEXT_LONG:
      return (
        <RowTextLong
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.DROPDOWN:
      return (
        <RowDropdown
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.DATE:
      return (
        <RowDate
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.FILE:
      return (
        <RowFile
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.RELATIONSHIP:
      return (
        <RowRelationship
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.CATEGORY:
      return (
        <RowCategory
          field={field}
          formField={formField}
          disabled={disabled}
        />
      );
    case FIELD_TYPE.FIELD_GROUP:
      return (
        <RowFieldGroup
          field={field}
          formField={formField}
          disabled={disabled}
          tableSlug={tableSlug}
        />
      );
    default:
      return null;
  }
}

// TEXT_SHORT component
function RowTextShort({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <InputGroup data-disabled={disabled}>
      <InputGroupInput
        disabled={disabled}
        id={formField.name}
        name={formField.name}
        type="text"
        placeholder={`Digite ${field.name.toLowerCase()}`}
        value={formField.state.value ?? ''}
        onBlur={formField.handleBlur}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          formField.handleChange(e.target.value)
        }
      />
      <InputGroupAddon>
        <TextIcon className="size-4" />
      </InputGroupAddon>
    </InputGroup>
  );
}

// TEXT_LONG component
function RowTextLong({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <Textarea
      disabled={disabled}
      id={formField.name}
      name={formField.name}
      placeholder={`Digite ${field.name.toLowerCase()}`}
      value={formField.state.value ?? ''}
      onBlur={formField.handleBlur}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        formField.handleChange(e.target.value)
      }
      rows={3}
    />
  );
}

// DROPDOWN component
function RowDropdown({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  const options =
    field.configuration.dropdown?.map((d) => ({
      value: d,
      label: d,
    })) ?? [];

  if (field.configuration.multiple) {
    return (
      <MultipleSelector
        disabled={disabled}
        value={formField.state.value ?? []}
        onChange={(opts: Array<Option>) => formField.handleChange(opts)}
        options={options}
        placeholder={`Selecione ${field.name.toLowerCase()}`}
        className="w-full"
      />
    );
  }

  return (
    <SimpleSelect
      disabled={disabled}
      selectedValues={
        formField.state.value
          ? [{ value: formField.state.value, label: formField.state.value }]
          : []
      }
      onChange={(opts) => formField.handleChange(opts[0]?.value ?? '')}
      options={options}
      placeholder={`Selecione ${field.name.toLowerCase()}`}
      className="w-full"
    />
  );
}

// DATE component
function RowDate({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  const formatString = getDateFormatString(field.configuration.format);
  const dateValue = formField.state.value
    ? new Date(formField.state.value)
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !formField.state.value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {formField.state.value
            ? format(dateValue!, formatString, { locale: ptBR })
            : 'Selecione uma data'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => formField.handleChange(date?.toISOString() ?? '')}
        />
      </PopoverContent>
    </Popover>
  );
}

// FILE component
function RowFile({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  const value = formField.state.value as {
    files: Array<File>;
    storages: Array<IStorage>;
  };

  return (
    <FileUploadWithStorage
      value={value.files}
      onValueChange={(files) => formField.handleChange({ ...value, files })}
      onStorageChange={(storages) =>
        formField.handleChange({ ...value, storages })
      }
      maxFiles={field.configuration.multiple ? 10 : 1}
      className={cn(disabled && 'pointer-events-none opacity-50')}
    />
  );
}

// RELATIONSHIP component
function RowRelationship({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  const relConfig = field.configuration.relationship;

  if (!relConfig) {
    return (
      <p className="text-muted-foreground text-sm">
        Relacionamento não configurado
      </p>
    );
  }

  const fetchRelationshipRows = async (
    query: string,
    page: number,
  ): Promise<SearchableResponse> => {
    try {
      const response = await API.get<Paginated<IRow>>(
        `/tables/${relConfig.table.slug}/rows/paginated`,
        {
          params: {
            page,
            perPage: 10,
            ...(query && { search: query }),
          },
        },
      );

      return {
        items: response.data.data.map((row) => ({
          value: row._id,
          label: String(row[relConfig.field.slug] ?? row._id),
        })),
        nextPage: page < response.data.meta.lastPage ? page + 1 : null,
        totalItems: response.data.meta.total,
      };
    } catch (error) {
      console.error('Error fetching relationship rows:', error);
      return { items: [], nextPage: null, totalItems: 0 };
    }
  };

  return (
    <SearchableSelect
      disabled={disabled}
      identifier={`row.${field.slug}.relationship`}
      fetchOptions={fetchRelationshipRows}
      selectedValues={formField.state.value ?? []}
      onChange={(opts) => formField.handleChange(opts)}
      isMultiple={field.configuration.multiple}
      placeholder={`Selecione ${field.name.toLowerCase()}`}
      className="w-full"
    />
  );
}

// CATEGORY component
function RowCategory({
  field,
  formField,
  disabled,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
}): React.JSX.Element {
  const categories = field.configuration.category ?? [];
  const treeData = convertCategoriesToTreeNodes(categories);

  const selectedIds = React.useMemo(() => {
    if (field.configuration.multiple) {
      const values = formField.state.value as Array<string> | null;
      return values ?? [];
    }
    return formField.state.value ? [formField.state.value] : [];
  }, [formField.state.value, field.configuration.multiple]);

  const selectedLabel = React.useMemo(() => {
    if (field.configuration.multiple) {
      const values = (formField.state.value as Array<string> | null) ?? [];
      const labels = values
        .map((id) => findCategoryLabel(id, categories))
        .filter(Boolean);
      return labels.length > 0 ? labels.join(', ') : null;
    }
    return formField.state.value
      ? findCategoryLabel(formField.state.value, categories)
      : null;
  }, [formField.state.value, categories, field.configuration.multiple]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedLabel && 'text-muted-foreground',
          )}
        >
          {selectedLabel || `Selecione ${field.name.toLowerCase()}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-2"
        align="start"
      >
        <TreeList
          data={treeData}
          selectedIds={selectedIds}
          onSelectionChange={(ids) => {
            if (field.configuration.multiple) {
              formField.handleChange(ids);
            } else {
              formField.handleChange(ids[0] ?? '');
            }
          }}
          multiSelect={field.configuration.multiple}
          showCheckboxes={field.configuration.multiple}
        />
      </PopoverContent>
    </Popover>
  );
}

// FIELD_GROUP component
function RowFieldGroup({
  field,
  formField,
  disabled,
  tableSlug,
}: {
  field: IField;
  formField: any;
  disabled: boolean;
  tableSlug: string;
}): React.JSX.Element {
  const groupConfig = field.configuration.group;

  const groupTable = useQuery({
    queryKey: ['/tables/'.concat(groupConfig?.slug ?? ''), groupConfig?.slug],
    queryFn: async () => {
      const route = '/tables/'.concat(groupConfig?.slug ?? '');
      const response = await API.get<ITable>(route);
      return response.data;
    },
    enabled: Boolean(groupConfig?.slug),
  });

  if (!groupConfig) {
    return (
      <p className="text-muted-foreground text-sm">
        Grupo de campos não configurado
      </p>
    );
  }

  if (groupTable.status === 'pending') {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (groupTable.status === 'error') {
    return (
      <p className="text-destructive text-sm">
        Erro ao carregar grupo de campos
      </p>
    );
  }

  const groupFields = groupTable.data.fields.filter((f) => !f.trashed);

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      {groupFields.map((groupField) => (
        <RowFieldGroupItem
          key={groupField._id}
          parentField={field}
          groupField={groupField}
          formField={formField}
          disabled={disabled}
          tableSlug={tableSlug}
        />
      ))}
    </div>
  );
}

// Single field within a FIELD_GROUP
function RowFieldGroupItem({
  parentField,
  groupField,
  formField,
  disabled,
  tableSlug,
}: {
  parentField: IField;
  groupField: IField;
  formField: any;
  disabled: boolean;
  tableSlug: string;
}): React.JSX.Element | null {
  if (
    groupField.type === FIELD_TYPE.REACTION ||
    groupField.type === FIELD_TYPE.EVALUATION
  ) {
    return null;
  }

  const currentValue = formField.state.value ?? {};
  const fieldValue = currentValue[groupField.slug];

  const handleChange = (newValue: any): void => {
    formField.handleChange({
      ...currentValue,
      [groupField.slug]: newValue,
    });
  };

  const mockFormField = {
    name: `${parentField.slug}.${groupField.slug}`,
    state: {
      value: fieldValue,
      meta: { isTouched: false, isValid: true, errors: [] },
    },
    handleChange,
    handleBlur: (): void => {},
  };

  return (
    <Field>
      <FieldLabel>
        {groupField.name}
        {groupField.configuration.required && (
          <span className="text-destructive"> *</span>
        )}
      </FieldLabel>
      <RowFieldRenderer
        field={groupField}
        formField={mockFormField}
        disabled={disabled}
        tableSlug={tableSlug}
      />
    </Field>
  );
}
