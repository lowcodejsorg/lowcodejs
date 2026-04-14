import { FileTextIcon } from 'lucide-react';

import { SeparatorInfo } from '../-separator-info';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { ValueOf } from '@/lib/interfaces';
import { MenuUpdateBodySchema } from '@/lib/schemas';

export const MenuUpdateSchema = MenuUpdateBodySchema;
export type MenuUpdateFormValues = {
  name: string;
  type: ValueOf<typeof E_MENU_ITEM_TYPE>;
  table: string;
  html: string;
  url: string;
  parent: string;
  visibility: string;
};

export const menuUpdateFormDefaultValues: MenuUpdateFormValues = {
  name: '',
  type: E_MENU_ITEM_TYPE.SEPARATOR,
  table: '',
  html: '',
  url: '',
  parent: '',
  visibility: 'PUBLIC',
};

type MenuFormMode = 'show' | 'edit';
type MenuTypeProp = ValueOf<typeof E_MENU_ITEM_TYPE> | '';

const DEFAULT_PROPS: {
  isPending: boolean;
  mode: MenuFormMode;
  menuType: MenuTypeProp;
} = {
  isPending: false,
  mode: 'show',
  menuType: E_MENU_ITEM_TYPE.SEPARATOR,
};

export const UpdateMenuFormFields = withForm({
  defaultValues: menuUpdateFormDefaultValues,
  props: DEFAULT_PROPS,
  render: function Render({ form, isPending, mode, menuType }) {
    const isDisabled = mode === 'show' || isPending;

    return (
      <section
        data-test-id="menu-update-form-fields"
        className="space-y-4 p-2"
      >
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
              placeholder="Digite o nome do menu"
              disabled={isDisabled}
              icon={<FileTextIcon />}
            />
          )}
        </form.AppField>

        {/* Campo Tipo */}
        <form.AppField
          name="type"
          validators={{
            onChange: ({ value }) => {
              if (value.trim() === '') {
                return 'Tipo é obrigatório';
              }
              return undefined;
            },
            onBlur: ({ value }) => {
              if (value.trim() === '') {
                return 'Tipo é obrigatório';
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldMenuTypeSelect
              label="Tipo"
              placeholder="Selecione o tipo de menu"
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>

        {/* Campo Parent */}
        <form.AppField name="parent">
          {(field) => (
            <field.FieldMenuCombobox
              label="Menu Pai"
              placeholder="Nenhum (raiz)"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Tabela - Condicional para tipos TABLE e FORM */}
        {(menuType === E_MENU_ITEM_TYPE.TABLE ||
          menuType === E_MENU_ITEM_TYPE.FORM) && (
          <form.AppField
            name="table"
            validators={{
              onChange: ({ value }) => {
                if (value.trim() === '') {
                  return 'Tabela é obrigatória';
                }
                return undefined;
              },
              onBlur: ({ value }) => {
                if (value.trim() === '') {
                  return 'Tabela é obrigatória';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableComboboxField
                label="Tabela"
                placeholder="Selecione uma tabela..."
                disabled={isDisabled}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo HTML - Condicional para tipo PAGE */}
        {menuType === E_MENU_ITEM_TYPE.PAGE && (
          <form.AppField
            name="html"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '' || value === '<p></p>') {
                  return 'O conteúdo da página é obrigatório';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.FieldEditor
                label="Conteúdo da Página"
                showPreview={mode === 'show'}
              />
            )}
          </form.AppField>
        )}

        {/* Campo URL - Condicional para tipo EXTERNAL */}
        {menuType === E_MENU_ITEM_TYPE.EXTERNAL && (
          <form.AppField
            name="url"
            validators={{
              onChange: ({ value }) => {
                if (value.trim() === '') {
                  return 'URL é obrigatória';
                }
                try {
                  new URL(value);
                } catch {
                  return 'URL inválida';
                }
                return undefined;
              },
              onBlur: ({ value }) => {
                if (value.trim() === '') {
                  return 'URL é obrigatória';
                }
                try {
                  new URL(value);
                } catch {
                  return 'URL inválida';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.FieldUrl
                label="URL"
                placeholder="https://exemplo.com"
                disabled={isDisabled}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Visibilidade */}
        <form.AppField name="visibility">
          {(field) => (
            <field.FieldPermissionSelect
              label="Visibilidade"
              mode="menu"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Info para tipo SEPARATOR */}
        {menuType === E_MENU_ITEM_TYPE.SEPARATOR && <SeparatorInfo />}
      </section>
    );
  },
});
