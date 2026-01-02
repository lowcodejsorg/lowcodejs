import { FileTextIcon } from 'lucide-react';
import z from 'zod';

import { SeparatorInfo } from '../-separator-info';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { MENU_ITEM_TYPE } from '@/lib/constant';

export const MenuUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  table: z.string().optional(),
  html: z.string().optional(),
  url: z.string().optional(),
  parent: z.string().optional(),
});

export type MenuUpdateFormValues = z.infer<typeof MenuUpdateSchema>;

export const menuUpdateFormDefaultValues: MenuUpdateFormValues = {
  name: '',
  type: 'separator',
  table: '',
  html: '',
  url: '',
  parent: '',
};

export const UpdateMenuFormFields = withForm({
  defaultValues: menuUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    menuType: 'separator' as string,
  },
  render: function Render({ form, isPending, mode, menuType }) {
    const isDisabled = mode === 'show' || isPending;

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
            <field.TextField
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
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Tipo é obrigatório' };
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.MenuTypeSelectField
              label="Tipo"
              placeholder="Selecione o tipo de menu"
              disabled={isDisabled}
              required
            />
          )}
        </form.AppField>

        {/* Campo Parent - Oculto para tipo SEPARATOR */}
        {menuType !== MENU_ITEM_TYPE.SEPARATOR && (
          <form.AppField name="parent">
            {(field) => (
              <field.MenuComboboxField
                label="Menu Pai"
                placeholder="Nenhum (raiz)"
                disabled={isDisabled}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Tabela - Condicional para tipos TABLE e FORM */}
        {[MENU_ITEM_TYPE.TABLE, MENU_ITEM_TYPE.FORM].includes(menuType) && (
          <form.AppField
            name="table"
            validators={{
              onBlur: ({ value }) => {
                if (
                  [MENU_ITEM_TYPE.TABLE, MENU_ITEM_TYPE.FORM].includes(
                    menuType,
                  ) &&
                  (!value || value.trim() === '')
                ) {
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
                disabled={isDisabled}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo HTML - Condicional para tipo PAGE */}
        {menuType === MENU_ITEM_TYPE.PAGE && (
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
            {(field) => (
              <field.EditorField
                label="Conteúdo da Página"
                showPreview={mode === 'show'}
              />
            )}
          </form.AppField>
        )}

        {/* Campo URL - Condicional para tipo EXTERNAL */}
        {menuType === MENU_ITEM_TYPE.EXTERNAL && (
          <form.AppField
            name="url"
            validators={{
              onBlur: ({ value }) => {
                if (
                  menuType === MENU_ITEM_TYPE.EXTERNAL &&
                  (!value || value.trim() === '')
                ) {
                  return { message: 'URL é obrigatória' };
                }
                if (value && value.trim() !== '') {
                  try {
                    new URL(value);
                  } catch {
                    return { message: 'URL inválida' };
                  }
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.UrlField
                label="URL"
                placeholder="https://exemplo.com"
                disabled={isDisabled}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Info para tipo SEPARATOR */}
        {menuType === MENU_ITEM_TYPE.SEPARATOR && <SeparatorInfo />}
      </section>
    );
  },
});
