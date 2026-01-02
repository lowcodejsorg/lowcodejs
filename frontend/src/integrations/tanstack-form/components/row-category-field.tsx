import React from 'react';

import { useFieldContext } from '../form-context';

import type { TreeNode } from '@/components/common/-tree-list';
import { TreeList } from '@/components/common/-tree-list';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { ICategory, IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface RowCategoryFieldProps {
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
      cat.children.length > 0
        ? convertCategoriesToTreeNodes(cat.children)
        : [],
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

export function RowCategoryField({
  field,
  disabled,
}: RowCategoryFieldProps): React.JSX.Element {
  const formField = useFieldContext<string | Array<string>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const categories = field.configuration.category ?? [];
  const treeData = convertCategoriesToTreeNodes(categories);

  const selectedIds = React.useMemo(() => {
    if (field.configuration.multiple) {
      const values = formField.state.value as Array<string> | null;
      return values ?? [];
    }
    return formField.state.value ? [formField.state.value as string] : [];
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
      ? findCategoryLabel(formField.state.value as string, categories)
      : null;
  }, [formField.state.value, categories, field.configuration.multiple]);

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
        <PopoverContent className="w-80 p-2" align="start">
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
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
