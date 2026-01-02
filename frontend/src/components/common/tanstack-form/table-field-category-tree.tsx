import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import type { TreeNode } from '@/components/common/-tree-list';
import { TreeEditor } from '@/components/common/-tree-node';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface TableFieldCategoryTreeProps {
  label: string;
  required?: boolean;
}

export function TableFieldCategoryTree({
  label,
  required,
}: TableFieldCategoryTreeProps): React.JSX.Element {
  const field = useFieldContext<Array<TreeNode>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <TreeEditor
        initialData={field.state.value ?? []}
        onChange={(data) => field.handleChange(data)}
        className={cn(isInvalid && 'border-destructive')}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
