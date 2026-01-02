/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useNavigate, useSearch } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FilterIcon, TextIcon, XIcon } from 'lucide-react';
import React from 'react';

import type { Option } from '@/components/common/-multi-selector';
import { MultipleSelector } from '@/components/common/-multi-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TreeNode } from '@/components/common/-tree-list';
import { TreeList } from '@/components/common/-tree-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FIELD_TYPE } from '@/lib/constant';
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
  }) as Record<string, string>;

  const [filterValues, setFilterValues] = React.useState<Record<string, any>>(
    {},
  );

  React.useEffect(() => {
    const initialValues: Record<string, any> = {};
    for (const field of fields) {
      if (search[field.slug]) {
        if (field.type === FIELD_TYPE.DROPDOWN) {
          initialValues[field.slug] = search[field.slug]
            .split(',')
            .map((v) => ({ value: v, label: v }));
        } else if (field.type === FIELD_TYPE.CATEGORY) {
          initialValues[field.slug] = search[field.slug].split(',');
        } else {
          initialValues[field.slug] = search[field.slug];
        }
      }
      if (search[`${field.slug}-initial`]) {
        initialValues[`${field.slug}-initial`] = parseISO(
          search[`${field.slug}-initial`],
        );
      }
      if (search[`${field.slug}-final`]) {
        initialValues[`${field.slug}-final`] = parseISO(
          search[`${field.slug}-final`],
        );
      }
    }
    setFilterValues(initialValues);
  }, [fields, search]);

  const handleSubmit = (): void => {
    const filters: Record<string, string | undefined> = {};

    for (const field of fields) {
      const value = filterValues[field.slug];

      if (
        [FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field.type) &&
        value
      ) {
        filters[field.slug] = String(value);
      }

      if (field.type === FIELD_TYPE.DROPDOWN && Array.isArray(value)) {
        const values = value.map((v: Option) => v.value).filter(Boolean);
        if (values.length > 0) {
          filters[field.slug] = values.join(',');
        }
      }

      if (field.type === FIELD_TYPE.CATEGORY && Array.isArray(value)) {
        if (value.length > 0) {
          filters[field.slug] = value.join(',');
        }
      }

      if (field.type === FIELD_TYPE.DATE) {
        const initial = filterValues[`${field.slug}-initial`];
        const final = filterValues[`${field.slug}-final`];

        if (initial instanceof Date) {
          filters[`${field.slug}-initial`] = format(initial, 'yyyy-MM-dd');
        }
        if (final instanceof Date) {
          filters[`${field.slug}-final`] = format(final, 'yyyy-MM-dd');
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
      search[f.slug] ||
      search[`${f.slug}-initial`] ||
      search[`${f.slug}-final`]
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
            {fields?.map((field) => (
              <div
                key={field.slug}
                className="flex w-full flex-col relative"
              >
                {field.type === FIELD_TYPE.TEXT_SHORT && (
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

                {field.type === FIELD_TYPE.TEXT_LONG && (
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

                {field.type === FIELD_TYPE.DROPDOWN && (
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

                {field.type === FIELD_TYPE.DATE && (
                  <FilterDate
                    field={field}
                    initialValue={filterValues[`${field.slug}-initial`]}
                    finalValue={filterValues[`${field.slug}-final`]}
                    onChangeInitial={(value) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        [`${field.slug}-initial`]: value,
                      }))
                    }
                    onChangeFinal={(value) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        [`${field.slug}-final`]: value,
                      }))
                    }
                  />
                )}

                {field.type === FIELD_TYPE.CATEGORY && (
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

function FilterDropdown({
  field,
  value,
  onChange,
}: {
  field: IField;
  value: Array<Option>;
  onChange: (value: Array<Option>) => void;
}): React.JSX.Element {
  const options =
    field.configuration.dropdown?.map((d) => ({
      value: d,
      label: d,
    })) ?? [];

  // Para single select, extrair o valor da primeira opção
  const singleValue = value.length > 0 ? value[0].value : '';

  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      {field.configuration.multiple ? (
        <MultipleSelector
          value={value}
          onChange={onChange}
          options={options}
          placeholder={`Filtrar por ${field.name.toLowerCase()}`}
          className="w-full"
        />
      ) : (
        <Select
          value={singleValue}
          onValueChange={(v) => onChange(v ? [{ value: v, label: v }] : [])}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Filtrar por ${field.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

function FilterDate({
  field,
  initialValue,
  finalValue,
  onChangeInitial,
  onChangeFinal,
}: {
  field: IField;
  initialValue?: Date;
  finalValue?: Date;
  onChangeInitial: (value: Date | undefined) => void;
  onChangeFinal: (value: Date | undefined) => void;
}): React.JSX.Element {
  return (
    <Field>
      <FieldLabel>{field.name}</FieldLabel>
      <div className="inline-flex w-full space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !initialValue && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {initialValue
                ? format(initialValue, 'dd/MM/yyyy', { locale: ptBR })
                : 'Data inicial'}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
          >
            <Calendar
              mode="single"
              selected={initialValue}
              onSelect={onChangeInitial}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !finalValue && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {finalValue
                ? format(finalValue, 'dd/MM/yyyy', { locale: ptBR })
                : 'Data final'}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
          >
            <Calendar
              mode="single"
              selected={finalValue}
              onSelect={onChangeFinal}
            />
          </PopoverContent>
        </Popover>
      </div>
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
  const categories = field.configuration.category ?? [];
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
