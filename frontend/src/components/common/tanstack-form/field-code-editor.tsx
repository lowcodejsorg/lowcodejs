import { CodeEditor } from '@/components/code-editor/code-editor';
import type { HookType } from '@/components/code-editor/tutorial-content';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { ITable } from '@/lib/interfaces';

/**
 * Validates if code is in IIFE format: (async () => { ... })();
 */
export function isValidIIFE(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true; // empty is valid
  return trimmed.startsWith('(async') && trimmed.endsWith('})();');
}

interface FieldCodeEditorProps {
  label?: string;
  table?: ITable;
  hook?: HookType;
}

export function FieldCodeEditor({
  label,
  table,
  hook,
}: FieldCodeEditorProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isValid = isValidIIFE(field.state.value);

  return (
    <div>
      <CodeEditor
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        label={label}
        table={table}
        hook={hook}
      />
      {!isValid && field.state.value.trim() && (
        <p className="text-sm text-destructive mt-1">
          O codigo deve estar no formato IIFE: (async () =&gt; {'{ ... }'})();
        </p>
      )}
    </div>
  );
}
