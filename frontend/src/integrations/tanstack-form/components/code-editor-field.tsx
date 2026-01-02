import { CodeEditor } from '@/components/common/code-editor';
import type { ITable } from '@/lib/interfaces';

import { useFieldContext } from '../form-context';

interface CodeEditorFieldProps {
  label?: string;
  table?: ITable;
}

export function CodeEditorField({
  label,
  table,
}: CodeEditorFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();

  return (
    <CodeEditor
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      label={label}
      table={table}
    />
  );
}
