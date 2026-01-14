/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useNavigate, useSearch } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { FilterIcon, TextIcon, XIcon } from 'lucide-react';
import React from 'react';

import type { TreeNode } from '@/components/common/-tree-list';
import { TreeList } from '@/components/common/-tree-list';
import { Datepicker } from '@/components/common/datepicker';
import type { DatepickerValue } from '@/components/common/datepicker';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { ICategory, IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface SheetFilterProps {
  fields: Array<IField>;
}

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

export function SheetFilter({ fields }: SheetFilterProps): React.JSX.Element {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const search = useSearch({
    strict: false,
  });

  const [filterValues, setFilterValues] = React.useState<Record<string, any>>(
    {},
  );

  React.useEffect(() => {
    const initialValues: Record<string, unknown> = {};
    for (const field of fields) {
      const fieldValue = search[field.slug];
      if (typeof fieldValue === 'string') {
        if (field.type === E_FIELD_TYPE.DROPDOWN) {
          initialValues[field.slug] = fieldValue
            .split(',')
            .map((v) => ({ value: v, label: v }));
        } else if (field.type === E_FIELD_TYPE.CATEGORY) {
          initialValues[field.slug] = fieldValue.split(',');
        } else {
          initialValues[field.slug] = fieldValue;
        }
      }

      // Para campos DATE, usar o novo formato DatepickerValue
      if (field.type === E_FIELD_TYPE.DATE) {
        const initialDateStr = search[`${field.slug}-initial`];
        const finalDateStr = search[`${field.slug}-final`];

        if (
          typeof initialDateStr === 'string' ||
          typeof finalDateStr === 'string'
        ) {
          initialValues[field.slug] = {
            startDate:
              typeof initialDateStr === 'string'
                ? parseISO(initialDateStr)
                : null,
            endDate:
              typeof finalDateStr === 'string' ? parseISO(finalDateStr) : null,
          };
        }
      }
    }
    setFilterValues(initialValues);
  }, [fields, search]);

  const handleSubmit = (): void => {
    const filters: Record<string, string | undefined> = {};

    for (const field of fields) {
      const value = filterValues[field.slug];

      if (
        [
          E_FIELD_TYPE.TEXT_SHORT.toString(),
          E_FIELD_TYPE.TEXT_LONG.toString(),
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

      if (field.type === E_FIELD_TYPE.DATE) {
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

    setOpen(false);
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
    setOpen(false);
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

  const activeFiltersCount = fields.filter((f) => {
    return (
      search[f.slug] || search[`${f.slug}-initial`] || search[`${f.slug}-final`]
    );
  }).length;

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <div className="relative">
          <Button
            className={cn('shadow-none p-1 h-auto')}
            variant="outline"
          >
            <FilterIcon className="size-4" />
            <span>Filtros</span>
          </Button>
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">Filtros</SheetTitle>
          <SheetDescription>
            Aplique filtros para a busca de dados
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 w-full">
          <section className="flex flex-col gap-4 w-full">
            {fields.map((field) => (
              <div
                key={field.slug}
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
                    onChange={(value) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        [field.slug]: value,
                      }))
                    }
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

                {field.type === E_FIELD_TYPE.CATEGORY && (
                  <FilterCategory
                    field={field}
                    value={filterValues[field.slug] ?? []}
                    onChange={(value) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        [field.slug]: value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </section>

          <SheetFooter className="flex-row w-full justify-end gap-4 px-0">
            <Button
              onClick={handleClear}
              type="button"
              className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
            >
              Limpar
            </Button>
            <Button onClick={handleSubmit}>Pesquisar</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterTextShort({
  field,
  value,
  onChange,
  onRemove,
  hasValue,
}: {
  field: IField;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  hasValue: boolean;
}): React.JSX.Element {
  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      <div className="relative">
        <InputGroup>
          <InputGroupInput
            type="text"
            placeholder={`Filtrar por ${field.name.toLowerCase()}`}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
          />
          <InputGroupAddon>
            <TextIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>
        {hasValue && (
          <Button
            size="icon-sm"
            className="cursor-pointer rounded-full size-4 absolute -right-1 -top-1"
            variant="destructive"
            onClick={onRemove}
          >
            <XIcon className="size-3" />
          </Button>
        )}
      </div>
    </Field>
  );
}

interface DropdownOption {
  value: string;
  label: string;
}

function FilterDropdown({
  field,
  value,
  onChange,
}: {
  field: IField;
  value: Array<string>;
  onChange: (value: Array<string>) => void;
}): React.JSX.Element {
  const anchorRef = useComboboxAnchor();
  const options: Array<DropdownOption> = field.configuration.dropdown.map(
    (d) => ({
      value: d,
      label: d,
    }),
  );

  // Find selected options for multiple select
  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  // Para single select, extrair o valor da primeira opção
  const singleValue = value.length > 0 ? value[0] : '';

  if (field.configuration.multiple) {
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
              {(values: Array<DropdownOption>): React.ReactNode => (
                <React.Fragment>
                  {values.map((opt) => (
                    <ComboboxChip
                      key={opt.value}
                      aria-label={opt.label}
                    >
                      {opt.label}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder={
                      values.length > 0
                        ? ''
                        : `Filtrar por ${field.name.toLowerCase()}`
                    }
                  />
                </React.Fragment>
              )}
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
        value={singleValue}
        onValueChange={(v) => onChange(v ? [v] : [])}
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

function FilterDate({
  field,
  value,
  onChange,
}: {
  field: IField;
  value: DatepickerValue | null;
  onChange: (value: DatepickerValue | null) => void;
}): React.JSX.Element {
  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      <Datepicker
        value={value}
        onChange={onChange}
        useRange={false}
        asSingle={false}
        placeholder="Selecione o período"
      />
    </Field>
  );
}

function FilterCategory({
  field,
  value,
  onChange,
}: {
  field: IField;
  value: Array<string>;
  onChange: (value: Array<string>) => void;
}): React.JSX.Element {
  const categories = field.configuration.category;
  const treeData = convertCategoriesToTreeNodes(categories);

  const selectedLabel = React.useMemo(() => {
    if (value.length === 0) return null;
    const labels = value
      .map((id) => findCategoryLabel(id, categories))
      .filter(Boolean);
    return labels.length > 0 ? labels.join(', ') : null;
  }, [value, categories]);

  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
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
            multiSelect={field.configuration.multiple}
            showCheckboxes={field.configuration.multiple}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
