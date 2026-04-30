import { useStore } from '@tanstack/react-store';
import { FileTextIcon } from 'lucide-react';

import { SeparatorInfo } from '../-separator-info';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { ValueOf } from '@/lib/interfaces';
import type { MenuCreatePayload } from '@/lib/payloads';
import { MenuCreateBodySchema } from '@/lib/schemas';

export const MenuCreateSchema = MenuCreateBodySchema;
export type MenuFormType = Omit<MenuCreatePayload, 'order'> & {
  position: string;
};

export const menuFormDefaultValues: MenuFormType = {
  name: '',
  type: E_MENU_ITEM_TYPE.SEPARATOR,
  table: '',
  html: '',
  url: '',
  parent: '',
  position: '0',
};

export const CreateMenuFormFields = withForm({
  defaultValues: menuFormDefaultValues,
  props: {
    isPending: false,
    menuType: E_MENU_ITEM_TYPE.SEPARATOR as
      | ValueOf<typeof E_MENU_ITEM_TYPE>
      | '',
  },
  render: function Render({ form, isPending, menuType }) {
    const parent = useStore(form.store, (state) => state.values.parent);

    return (
      <section
        data-test-id="menu-create-form-fields"
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
              disabled={isPending}
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
              disabled={isPending}
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
              disabled={isPending}
            />
          )}
        </form.AppField>

        <form.AppField
          name="position"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Posição é obrigatória';
              return undefined;
            },
            onBlur: ({ value }) => {
              if (!value) return 'Posição é obrigatória';
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldMenuPositionSelect
              label="Inserir após"
              parentId={parent || undefined}
              disabled={isPending}
              required
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
                if (!value || value.trim() === '') {
                  return 'Tabela é obrigatória';
                }
                return undefined;
              },
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
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
                disabled={isPending}
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
            {(field) => <field.FieldEditor label="Conteúdo da Página" />}
          </form.AppField>
        )}

        {/* Campo URL - Condicional para tipo EXTERNAL */}
        {menuType === E_MENU_ITEM_TYPE.EXTERNAL && (
          <form.AppField
            name="url"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
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
                if (!value || value.trim() === '') {
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
                disabled={isPending}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Info para tipo SEPARATOR */}
        {menuType === E_MENU_ITEM_TYPE.SEPARATOR && <SeparatorInfo />}
      </section>
    );
  },
});
