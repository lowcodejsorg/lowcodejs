import React from 'react';

import type { TreeNode } from '@/components/common/-tree-list';
import { TreeList } from '@/components/common/-tree-list';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { ICategory, IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowCategoryFieldProps {
  field: IField;
  disabled?: boolean;
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

export function TableRowCategoryField({
  field,
  disabled,
}: TableRowCategoryFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<string>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const categories = Array.isArray(field.configuration.category)
    ? field.configuration.category
    : [];
  const treeData = convertCategoriesToTreeNodes(categories);

  const selectedIds = React.useMemo(() => {
    const value = formField.state.value as unknown;
    if (Array.isArray(value)) return value;
    if (value) return [String(value)];
    return [];
  }, [formField.state.value]);

  const selectedLabel = React.useMemo(() => {
    const value = formField.state.value as unknown;
    const values = Array.isArray(value)
      ? value
      : value
        ? [String(value)]
        : [];
    const labels = values
      .map((id) => findCategoryLabel(id, categories))
      .filter(Boolean);
    return labels.length > 0 ? labels.join(', ') : null;
  }, [formField.state.value, categories]);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
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
              if (!field.configuration.multiple) {
                const [id] = ids;
                formField.handleChange(id ? [id] : []);
              }

              if (field.configuration.multiple) {
                formField.handleChange(ids);
              }
            }}
            multiSelect={field.configuration.multiple}
            showCheckboxes={field.configuration.multiple}
          />
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
