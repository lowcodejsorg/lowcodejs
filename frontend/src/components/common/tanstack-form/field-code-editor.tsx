import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { CodeEditor } from '@/components/common/code-editor';
import type { ITable } from '@/lib/interfaces';

interface FieldCodeEditorProps {
  label?: string;
  table?: ITable;
}

export function FieldCodeEditor({
  label,
  table,
}: FieldCodeEditorProps): React.JSX.Element {
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
