import { useStore } from '@tanstack/react-store';
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
  position: string;
  isInitial: boolean;
};

export const menuUpdateFormDefaultValues: MenuUpdateFormValues = {
  name: '',
  type: E_MENU_ITEM_TYPE.SEPARATOR,
  table: '',
  html: '',
  url: '',
  parent: '',
  position: '0',
  isInitial: false,
};

export const UpdateMenuFormFields = withForm({
  defaultValues: menuUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    menuType: E_MENU_ITEM_TYPE.SEPARATOR as
      | ValueOf<typeof E_MENU_ITEM_TYPE>
      | '',
    originalType: E_MENU_ITEM_TYPE.SEPARATOR as
      | ValueOf<typeof E_MENU_ITEM_TYPE>
      | '',
    hasChildren: false,
    menuId: '',
  },
  render: function Render({
    form,
    isPending,
    mode,
    menuType,
    originalType,
    hasChildren,
    menuId,
  }) {
    const parent = useStore(form.store, (state) => state.values.parent);
    const isDisabled = mode === 'show' || isPending;
    const isSeparatorWithChildren =
      originalType === E_MENU_ITEM_TYPE.SEPARATOR && hasChildren;

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
              if (!value || value.trim() === '') {
                return 'Tipo é obrigatório';
              }
              return undefined;
            },
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
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
              disabled={isDisabled || isSeparatorWithChildren}
              required
            />
          )}
        </form.AppField>
        {isSeparatorWithChildren && mode === 'edit' && (
          <p className="text-muted-foreground text-xs -mt-2">
            Este separador possui submenus ativos e por isso o tipo não pode ser
            alterado.
          </p>
        )}

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
              disabled={isDisabled}
              excludeId={menuId}
              required
            />
          )}
        </form.AppField>

        {menuType !== E_MENU_ITEM_TYPE.SEPARATOR && (
          <form.AppField name="isInitial">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Página inicial"
                description="Carregar este menu ao acessar o sistema"
                disabled={isDisabled}
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

        {/* Info para tipo SEPARATOR */}
        {menuType === E_MENU_ITEM_TYPE.SEPARATOR && <SeparatorInfo />}
      </section>
    );
  },
});
