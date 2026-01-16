import { FileTextIcon } from 'lucide-react';

import { SeparatorInfo } from '../-separator-info';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { ValueOf } from '@/lib/interfaces';
import type { MenuCreatePayload } from '@/lib/payloads';
import { MenuCreateBodySchema } from '@/lib/schemas';

export const MenuCreateSchema = MenuCreateBodySchema;
export type MenuFormType = MenuCreatePayload;

export const menuFormDefaultValues: MenuFormType = {
  name: '',
  type: E_MENU_ITEM_TYPE.SEPARATOR,
  table: '',
  html: '',
  url: '',
  parent: '',
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
    return (
      <section className="space-y-4 p-2">
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
            onBlur: ({ value }) => {
              if (value.trim() === '') {
                return { message: 'Tipo é obrigatório' };
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

        {/* Campo Parent - Oculto para tipo SEPARATOR */}
        {menuType !== E_MENU_ITEM_TYPE.SEPARATOR && (
          <form.AppField name="parent">
            {(field) => (
              <field.FieldMenuCombobox
                label="Menu Pai"
                placeholder="Nenhum (raiz)"
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Tabela - Condicional para tipos TABLE e FORM */}
        {(menuType === E_MENU_ITEM_TYPE.TABLE ||
          menuType === E_MENU_ITEM_TYPE.FORM) && (
          <form.AppField
            name="table"
            validators={{
              onBlur: ({ value }) => {
                if (value.trim() === '') {
                  return { message: 'Tabela é obrigatória' };
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
                  return { message: 'O conteúdo da página é obrigatório' };
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
              onBlur: ({ value }) => {
                if (value.trim() === '') {
                  return { message: 'URL é obrigatória' };
                }
                try {
                  new URL(value);
                } catch {
                  return { message: 'URL inválida' };
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
