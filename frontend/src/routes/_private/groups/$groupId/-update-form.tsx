import { HashIcon, UsersIcon } from 'lucide-react';
import z from 'zod';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { withForm } from '@/integrations/tanstack-form/form-hook';

export const GroupUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Selecione ao menos uma permissão'),
});

export type GroupUpdateFormValues = z.infer<typeof GroupUpdateSchema>;

export const groupUpdateFormDefaultValues: GroupUpdateFormValues = {
  name: '',
  description: '',
  permissions: [],
};

export const UpdateGroupFormFields = withForm({
  defaultValues: groupUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    slug: '',
  },
  render: function Render({ form, isPending, mode, slug }) {
    const isDisabled = mode === 'show' || isPending;

    return (
      <section className="space-y-4 p-2">
        {/* Campo Slug (read-only) */}
        <Field>
          <FieldLabel>Slug (identificador)</FieldLabel>
          <InputGroup>
            <InputGroupInput
              disabled
              type="text"
              value={slug}
              readOnly
              className="bg-muted"
            />
            <InputGroupAddon>
              <HashIcon />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        {/* Campo Nome */}
        <form.AppField
          name="name"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Nome é obrigatório' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.TextField
              label="Nome"
              placeholder="Digite o nome do grupo"
              disabled={isDisabled}
              icon={<UsersIcon />}
            />
          )}
        </form.AppField>

        {/* Campo Descrição */}
        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label="Descrição (opcional)"
              placeholder="Descrição do grupo (opcional)"
              disabled={isDisabled}
              rows={3}
            />
          )}
        </form.AppField>

        {/* Campo Permissões */}
        <form.AppField
          name="permissions"
          validators={{
            onBlur: ({ value }) => {
              if (value.length === 0) {
                return { message: 'Selecione ao menos uma permissão' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.PermissionMultiSelectField
              label="Permissões"
              placeholder="Selecione as permissões..."
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
