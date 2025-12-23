import Editor from '@monaco-editor/react';

import { CodeEditorInfoModal } from '@/components/common/code-editor-info-modal';
import { Label } from '@/components/ui/label';
import type { ITable } from '@/lib/interfaces';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  table?: ITable;
}

export function CodeEditor({
  value,
  onChange,
  label = 'Editor JavaScript',
  table,
}: CodeEditorProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <CodeEditorInfoModal
          table={table}
          label={label}
        />
      </div>

      <div className="border rounded-md overflow-hidden">
        <Editor
          height="300px"
          defaultLanguage="javascript"
          value={value}
          onChange={(val) => onChange(val || '')}
          // theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
