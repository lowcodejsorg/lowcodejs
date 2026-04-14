import { HashIcon, UsersIcon } from 'lucide-react';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_ROLE } from '@/lib/constant';
import { UserGroupUpdateBodySchema } from '@/lib/schemas';

const RoleMapper = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.REGISTERED]: 'Registrado',
  [E_ROLE.MANAGER]: 'Gerente',
  [E_ROLE.MASTER]: 'Dono',
};

export const GroupUpdateSchema = UserGroupUpdateBodySchema;
export type GroupUpdateFormValues = {
  name: string;
  description: string;
  permissions: Array<string>;
  encompasses: Array<string>;
  systemPermissions: Record<string, boolean>;
};

export const groupUpdateFormDefaultValues: GroupUpdateFormValues = {
  name: '',
  description: '',
  permissions: [],
  encompasses: [],
  systemPermissions: {},
};

export const UpdateGroupFormFields = withForm({
  defaultValues: groupUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    slug: '',
    immutable: false,
    currentGroupId: '',
  },
  render: function Render({
    form,
    isPending,
    mode,
    slug,
    immutable,
    currentGroupId,
  }) {
    const isDisabled = mode === 'show' || isPending || immutable;

    return (
      <section
        data-test-id="group-update-form-fields"
        className="space-y-4 p-2"
      >
        {/* Campo Slug (read-only) */}
        <Field>
          <FieldLabel>Slug (identificador)</FieldLabel>
          <InputGroup>
            <InputGroupInput
              data-test-id="group-slug-input"
              disabled
              type="text"
              value={RoleMapper[slug as keyof typeof RoleMapper] || slug}
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
            onChange: ({ value }) => {
              if (!value || value.trim() === '') {
                return 'Nome é obrigatório';
              }
              return undefined;
            },
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return 'Nome é obrigatório';
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldText
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
            <field.FieldTextarea
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
            onChange: ({ value }) => {
              if (value.length === 0) {
                return 'Selecione ao menos uma permissão';
              }
              return undefined;
            },
            onBlur: ({ value }) => {
              if (value.length === 0) {
                return 'Selecione ao menos uma permissão';
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldPermissionMultiSelect
              label="Permissões"
              placeholder="Selecione as permissões..."
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>

        {/* Campo Permissões do Sistema */}
        <form.AppField name="systemPermissions">
          {(field) => (
            <field.FieldSystemPermissionCheckboxes
              label="Permissões do Sistema"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Abrange (grupos englobados) */}
        <form.AppField name="encompasses">
          {(field) => (
            <field.FieldGroupMultiSelect
              label="Abrange"
              placeholder="Selecione os grupos englobados..."
              disabled={isDisabled}
              excludeIds={[currentGroupId]}
            />
          )}
        </form.AppField>

        {/* Aviso de grupo imutável */}
        {immutable && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Este grupo é imutável e não pode ser editado.
          </div>
        )}
      </section>
    );
  },
});
