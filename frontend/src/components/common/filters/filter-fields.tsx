/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useNavigate, useSearch } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { TextIcon, XIcon } from 'lucide-react';
import React from 'react';

import { RangeDatepicker } from '@/components/common/datepicker';
import type { DatepickerValue } from '@/components/common/datepicker';
import type { TreeNode } from '@/components/common/tree-editor/tree-list';
import { TreeList } from '@/components/common/tree-editor/tree-list';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { ICategory, IFilterField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

export function convertCategoriesToTreeNodes(
  categories: Array<ICategory>,
): Array<TreeNode> {
  return categories.map((cat) => {
    let children: Array<TreeNode> = [];
    if (cat.children.length > 0) {
      children = convertCategoriesToTreeNodes(cat.children);
    }
    return {
      id: cat.id,
      label: cat.label,
      children,
    };
  });
}

export function findCategoryLabel(
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

interface UseFilterStateReturn {
  filterValues: Record<string, any>;
  setFilterValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  handleSubmit: () => void;
  handleClear: () => void;
  removeFilter: (key: string) => void;
  handleMultiValueChange: (field: IFilterField, value: Array<string>) => void;
  activeFiltersCount: number;
}

export function useFilterState(
  fields: Array<IFilterField>,
  options?: { closeOnSubmit?: boolean; onClose?: () => void },
): UseFilterStateReturn {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });

  const [filterValues, setFilterValues] = React.useState<Record<string, any>>(
    {},
  );

  const fieldsKey = fields.map((f) => f.slug).join(',');

  React.useEffect(() => {
    const initialValues: Record<string, unknown> = {};
    for (const field of fields) {
      const fieldValue = search[field.slug];
      if (typeof fieldValue === 'string') {
        if (
          field.type === E_FIELD_TYPE.DROPDOWN ||
          field.type === E_FIELD_TYPE.CATEGORY
        ) {
          initialValues[field.slug] = fieldValue.split(',');
        } else {
          initialValues[field.slug] = fieldValue;
        }
      }

      if (
        field.type === E_FIELD_TYPE.DATE ||
        field.type === E_FIELD_TYPE.CREATED_AT
      ) {
        const initialDateStr = search[`${field.slug}-initial`];
        const finalDateStr = search[`${field.slug}-final`];

        if (
          typeof initialDateStr === 'string' ||
          typeof finalDateStr === 'string'
        ) {
          let startDate: Date | null = null;
          if (typeof initialDateStr === 'string') {
            startDate = parseISO(initialDateStr);
          }
          let endDate: Date | null = null;
          if (typeof finalDateStr === 'string') {
            endDate = parseISO(finalDateStr);
          }
          initialValues[field.slug] = { startDate, endDate };
        }
      }
    }
    setFilterValues(initialValues);
  }, [fieldsKey, search]);

  const handleSubmit = (): void => {
    const filters: Record<string, string | undefined> = {};

    // Initialize all field keys as undefined so cleared fields are removed from URL
    for (const field of fields) {
      filters[field.slug] = undefined;
      if (
        field.type === E_FIELD_TYPE.DATE ||
        field.type === E_FIELD_TYPE.CREATED_AT
      ) {
        filters[`${field.slug}-initial`] = undefined;
        filters[`${field.slug}-final`] = undefined;
      }
    }

    for (const field of fields) {
      const value = filterValues[field.slug];

      if (
        [
          E_FIELD_TYPE.TEXT_SHORT.toString(),
          E_FIELD_TYPE.TEXT_LONG.toString(),
          E_FIELD_TYPE.CREATOR.toString(),
        ].includes(field.type) &&
        value
      ) {
        filters[field.slug] = String(value);
      }

      if (field.type === E_FIELD_TYPE.DROPDOWN && Array.isArray(value)) {
        const values = (value as Array<string>).filter(Boolean);
        if (values.length > 0) {
          filters[field.slug] = values.join(',');
        }
      }

      if (field.type === E_FIELD_TYPE.CATEGORY && Array.isArray(value)) {
        if (value.length > 0) {
          filters[field.slug] = value.join(',');
        }
      }

      if (
        field.type === E_FIELD_TYPE.DATE ||
        field.type === E_FIELD_TYPE.CREATED_AT
      ) {
        const dateValue = filterValues[field.slug] as DatepickerValue | null;

        if (dateValue?.startDate) {
          filters[`${field.slug}-initial`] = format(
            dateValue.startDate,
            'yyyy-MM-dd',
          );
        }
        if (dateValue?.endDate) {
          filters[`${field.slug}-final`] = format(
            dateValue.endDate,
            'yyyy-MM-dd',
          );
        }
      }
    }

    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        ...filters,
        page: 1,
      }),
    });

    if (options?.closeOnSubmit) {
      options.onClose?.();
    }
  };

  const handleClear = (): void => {
    navigate({
      // @ts-ignore
      search: (state) => ({
        page: 1,
        perPage: state.perPage,
        trashed: state.trashed,
      }),
    });
    setFilterValues({});
    if (options?.closeOnSubmit) {
      options.onClose?.();
    }
  };

  const removeFilter = (key: string): void => {
    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        [key]: undefined,
        page: 1,
      }),
    });
    setFilterValues((prev) => ({ ...prev, [key]: undefined }));
  };

  // Dropdown/category aceitam multi-valor e sao persistidos como CSV na URL.
  // Ao remover um chip, precisamos refletir isso imediatamente na listagem;
  // adicoes continuam aguardando o botao Pesquisar.
  const handleMultiValueChange = (
    field: IFilterField,
    value: Array<string>,
  ): void => {
    const applied = search[field.slug];
    const appliedTokens =
      typeof applied === 'string' && applied.length > 0
        ? applied.split(',')
        : [];
    const isRemoval = value.length < appliedTokens.length;

    setFilterValues((prev) => ({ ...prev, [field.slug]: value }));

    if (!isRemoval) return;

    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        [field.slug]: value.length > 0 ? value.join(',') : undefined,
        page: 1,
      }),
    });
  };

  const activeFiltersCount = fields.filter((f) => {
    return (
      search[f.slug] || search[`${f.slug}-initial`] || search[`${f.slug}-final`]
    );
  }).length;

  return {
    filterValues,
    setFilterValues,
    handleSubmit,
    handleClear,
    removeFilter,
    handleMultiValueChange,
    activeFiltersCount,
  };
}

export function getActiveFiltersCount(
  fields: Array<IFilterField>,
  search: Record<string, unknown>,
): number {
  return fields.filter((f) => {
    return (
      search[f.slug] || search[`${f.slug}-initial`] || search[`${f.slug}-final`]
    );
  }).length;
}

interface FilterFieldsFormProps {
  fields: Array<IFilterField>;
  filterValues: Record<string, any>;
  setFilterValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  removeFilter: (key: string) => void;
  handleMultiValueChange: (field: IFilterField, value: Array<string>) => void;
  search: Record<string, unknown>;
}

export function FilterFieldsForm({
  fields,
  filterValues,
  setFilterValues,
  removeFilter,
  handleMultiValueChange,
  search,
}: FilterFieldsFormProps): React.JSX.Element {
  return (
    <section
      data-slot="filter-fields"
      data-test-id="filter-fields"
      className="flex flex-col gap-4 w-full"
    >
      {fields.map((field) => (
        <div
          key={field.slug}
          data-test-id={`filter-${field.slug}`}
          className="flex w-full flex-col relative"
        >
          {field.type === E_FIELD_TYPE.TEXT_SHORT && (
            <FilterTextShort
              field={field}
              value={filterValues[field.slug] ?? ''}
              onChange={(value) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [field.slug]: value,
                }))
              }
              onRemove={() => removeFilter(field.slug)}
              hasValue={Boolean(search[field.slug])}
            />
          )}

          {field.type === E_FIELD_TYPE.TEXT_LONG && (
            <FilterTextShort
              field={field}
              value={filterValues[field.slug] ?? ''}
              onChange={(value) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [field.slug]: value,
                }))
              }
              onRemove={() => removeFilter(field.slug)}
              hasValue={Boolean(search[field.slug])}
            />
          )}

          {field.type === E_FIELD_TYPE.DROPDOWN && (
            <FilterDropdown
              field={field}
              value={filterValues[field.slug] ?? []}
              onChange={(value) => handleMultiValueChange(field, value)}
            />
          )}

          {field.type === E_FIELD_TYPE.DATE && (
            <FilterDate
              field={field}
              value={filterValues[field.slug] ?? null}
              onChange={(value) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [field.slug]: value,
                }))
              }
            />
          )}

          {field.type === E_FIELD_TYPE.CREATED_AT && (
            <FilterDate
              field={field}
              value={filterValues[field.slug] ?? null}
              onChange={(value) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [field.slug]: value,
                }))
              }
            />
          )}

          {field.type === E_FIELD_TYPE.CREATOR && (
            <FilterTextShort
              field={field}
              value={filterValues[field.slug] ?? ''}
              onChange={(value) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [field.slug]: value,
                }))
              }
              onRemove={() => removeFilter(field.slug)}
              hasValue={Boolean(search[field.slug])}
            />
          )}

          {field.type === E_FIELD_TYPE.CATEGORY && (
            <FilterCategory
              field={field}
              value={filterValues[field.slug] ?? []}
              onChange={(value) => handleMultiValueChange(field, value)}
            />
          )}
        </div>
      ))}
    </section>
  );
}

export function FilterTextShort({
  field,
  value,
  onChange,
  onRemove,
  hasValue,
}: {
  field: IFilterField;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  hasValue: boolean;
}): React.JSX.Element {
  return (
    <Field data-slot="filter-text-short">
      <FieldLabel>{field.name}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          data-test-id={`filter-input-${field.slug}`}
          type="text"
          placeholder={`Filtrar por ${field.name.toLowerCase()}`}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
        />
        <InputGroupAddon align="inline-end">
          {hasValue && (
            <InputGroupButton
              data-test-id={`filter-clear-${field.slug}`}
              onClick={onRemove}
              variant="ghost"
              size="icon-xs"
              aria-label={`Limpar ${field.name}`}
            >
              <XIcon className="size-4" />
            </InputGroupButton>
          )}
          {!hasValue && <TextIcon className="size-4" />}
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

interface DropdownOption {
  value: string;
  label: string;
  color?: string | null;
}

export function FilterDropdown({
  field,
  value,
  onChange,
}: {
  field: IFilterField;
  value: Array<string>;
  onChange: (value: Array<string>) => void;
}): React.JSX.Element {
  const anchorRef = useComboboxAnchor();
  const options: Array<DropdownOption> = (field.dropdown ?? []).map((d) => ({
    value: d.id,
    label: d.label,
    color: d.color,
  }));

  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  let singleValue = '';
  if (value.length > 0) {
    singleValue = value[0];
  }

  if (field.multiple) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <Combobox
          items={options}
          multiple
          value={selectedOptions}
          onValueChange={(newValue: Array<DropdownOption>) => {
            onChange(newValue.map((v) => v.value));
          }}
          itemToStringLabel={(opt: DropdownOption) => opt.label}
        >
          <ComboboxChips
            ref={anchorRef}
            className="w-full"
          >
            <ComboboxValue>
              {(values: Array<DropdownOption>): React.ReactNode => {
                let chipsPlaceholder = `Filtrar por ${field.name.toLowerCase()}`;
                if (values.length > 0) {
                  chipsPlaceholder = '';
                }
                return (
                  <React.Fragment>
                    {values.map((opt) => (
                      <ComboboxChip
                        key={opt.value}
                        aria-label={opt.label}
                      >
                        {opt.label}
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput placeholder={chipsPlaceholder} />
                  </React.Fragment>
                );
              }}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchorRef}>
            <ComboboxEmpty>Nenhum resultado encontrado</ComboboxEmpty>
            <ComboboxList>
              {(opt: DropdownOption): React.ReactNode => (
                <ComboboxItem
                  key={opt.value}
                  value={opt}
                >
                  {opt.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      <Select
        data-test-id={`filter-select-${field.slug}`}
        value={singleValue}
        onValueChange={(v) => {
          if (v) {
            onChange([v]);
          } else {
            onChange([]);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={`Filtrar por ${field.name.toLowerCase()}`}
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function FilterDate({
  field,
  value,
  onChange,
}: {
  field: IFilterField;
  value: DatepickerValue | null;
  onChange: (value: DatepickerValue | null) => void;
}): React.JSX.Element {
  return (
    <Field data-slot="filter-date">
      <FieldLabel>{field.name}</FieldLabel>
      <RangeDatepicker
        data-test-id={`filter-date-${field.slug}`}
        value={value}
        onChange={onChange}
        dualCalendar={false}
        placeholder="Selecione o período"
      />
    </Field>
  );
}

export function FilterCategory({
  field,
  value,
  onChange,
}: {
  field: IFilterField;
  value: Array<string>;
  onChange: (value: Array<string>) => void;
}): React.JSX.Element {
  const categories = field.category ?? [];
  const treeData = convertCategoriesToTreeNodes(categories);

  const selectedLabel = React.useMemo(() => {
    if (value.length === 0) return null;
    const labels = value
      .map((id) => findCategoryLabel(id, categories))
      .filter(Boolean);
    if (labels.length > 0) {
      return labels.join(', ');
    }
    return null;
  }, [value, categories]);

  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            data-test-id={`filter-category-${field.slug}`}
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedLabel && 'text-muted-foreground',
            )}
          >
            {selectedLabel || `Filtrar por ${field.name.toLowerCase()}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-2"
          align="start"
        >
          <TreeList
            data={treeData}
            selectedIds={value}
            onSelectionChange={onChange}
            multiSelect={field.multiple}
            showCheckboxes={field.multiple}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
