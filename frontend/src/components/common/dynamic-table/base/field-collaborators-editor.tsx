import { PlusIcon, TrashIcon } from 'lucide-react';

import { UserMultiSelect } from '@/components/common/selectors/user-multi-select';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

const PROFILE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'VIEWER', label: 'Viewer' },
];

type Collaborator = { user: string; profile: string };

interface FieldCollaboratorsEditorProps {
  label: string;
  disabled?: boolean;
}

export function FieldCollaboratorsEditor({
  label,
  disabled,
}: FieldCollaboratorsEditorProps): React.JSX.Element {
  const field = useFieldContext<Array<Collaborator>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;
  const value = field.state.value ?? [];

  function updateAt(index: number, next: Collaborator): void {
    const copy = [...value];
    copy[index] = next;
    field.handleChange(copy);
  }

  function removeAt(index: number): void {
    field.handleChange(value.filter((_, i) => i !== index));
  }

  function addRow(): void {
    field.handleChange([...value, { user: '', profile: 'EDITOR' }]);
  }

  return (
    <Field
      data-slot="field-collaborators-editor"
      data-test-id="field-collaborators-editor"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

      <div className={cn('space-y-2', isInvalid && 'border-destructive')}>
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum colaborador. Clique em &quot;Adicionar colaborador&quot;.
          </p>
        )}

        {value.map((row, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-md border p-2"
          >
            <div className="flex-1">
              <UserMultiSelect
                disabled={disabled}
                value={row.user ? [row.user] : []}
                onValueChange={(selected) => {
                  const newest =
                    selected.length === 0 ? '' : selected[selected.length - 1];
                  updateAt(index, { ...row, user: newest });
                }}
                placeholder="Selecione um usuário"
              />
            </div>
            <div className="w-40">
              <Select
                disabled={disabled}
                value={row.profile}
                onValueChange={(profile) =>
                  updateAt(index, { ...row, profile })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={() => removeAt(index)}
              aria-label={`Remover colaborador ${index + 1}`}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addRow}
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          Adicionar colaborador
        </Button>
      </div>

      {isInvalid && (
        <FieldError
          id={errorId}
          errors={field.state.meta.errors}
        />
      )}
    </Field>
  );
}
