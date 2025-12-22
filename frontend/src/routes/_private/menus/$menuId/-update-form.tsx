import { useForm, useStore } from '@tanstack/react-form';
import { AxiosError } from 'axios';
import { FileTextIcon, FolderTreeIcon, LinkIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { SeparatorInfo } from '../-separator-info';

import { EditorExample } from '@/components/common/editor';
import { MenuCombobox } from '@/components/common/menu-combobox';
import { TableCombobox } from '@/components/common/table-combobox';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useUpdateMenu } from '@/integrations/tanstack-query/implementations/use-menu-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MENU_ITEM_TYPE, MetaDefault } from '@/lib/constant';
import type { IMenu, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

type UpdateMenuFormProps = {
  data: IMenu;
};

const MenuTypeOptions = [
  { value: MENU_ITEM_TYPE.TABLE, label: 'Tabela' },
  { value: MENU_ITEM_TYPE.PAGE, label: 'Página' },
  { value: MENU_ITEM_TYPE.FORM, label: 'Formulário' },
  { value: MENU_ITEM_TYPE.EXTERNAL, label: 'Link Externo' },
  { value: MENU_ITEM_TYPE.SEPARATOR, label: 'Separador' },
];

export function UpdateMenuForm({
  data,
}: UpdateMenuFormProps): React.JSX.Element {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useUpdateMenu({
    onSuccess(response) {
      queryClient.setQueryData<IMenu>(
        ['/menu/'.concat(response._id), response._id],
        response,
      );
      queryClient.setQueryData<Paginated<IMenu>>(
        ['/menu/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [response],
            };
          }

          return {
            meta: cached.meta,
            data: cached.data.map((item) => {
              if (item._id === response._id)
                return {
                  ...item,
                  ...response,
                };

              return item;
            }),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['/menu'],
      });

      toast('Menu atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados do menu foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data;

        toast('Erro ao atualizar o menu', {
          className: '!bg-destructive !text-white !border-destructive',
          description: responseData?.message ?? 'Erro ao atualizar o menu',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: data.name,
      type: data.type,
      table: data.table?._id || '',
      html: data.html || '',
      url: data.url || '',
      parent: data.parent?._id || '',
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        ...value,
        _id: data._id,
        html: value.html !== '' ? value.html : undefined,
        url: value.url !== '' ? value.url : undefined,
        parent: value.parent !== '' ? value.parent : undefined,
        table: value.table !== '' ? value.table : undefined,
      });
    },
  });

  const menuType = useStore(form.store, (state) => state.values.type);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <section className="space-y-4 p-2">
        {/* Campo Nome */}
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Nome é obrigatório' };
              }
              return undefined;
            },
          }}
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Nome <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    disabled={mode === 'show' || _update.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Digite o nome do menu"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  <InputGroupAddon>
                    <FileTextIcon />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Tipo */}
        <form.Field
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
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Tipo <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  disabled={mode === 'show' || _update.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    const newType = value as keyof typeof MENU_ITEM_TYPE;
                    field.handleChange(newType);

                    if (
                      newType !== MENU_ITEM_TYPE.TABLE &&
                      newType !== MENU_ITEM_TYPE.FORM
                    ) {
                      form.setFieldValue('table', '');
                    }

                    if (newType !== MENU_ITEM_TYPE.PAGE) {
                      form.setFieldValue('html', '');
                    }

                    if (newType !== MENU_ITEM_TYPE.EXTERNAL) {
                      form.setFieldValue('url', '');
                    }
                  }}
                >
                  <SelectTrigger
                    className={cn(isInvalid && 'border-destructive')}
                  >
                    <SelectValue placeholder="Selecione o tipo de menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {MenuTypeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        {/* Campo Tabela - Condicional para tipos TABLE e FORM */}
        {(menuType === MENU_ITEM_TYPE.TABLE ||
          menuType === MENU_ITEM_TYPE.FORM) && (
          <form.Field
            name="table"
            validators={{
              onBlur: ({ value }) => {
                if (
                  (menuType === MENU_ITEM_TYPE.TABLE ||
                    menuType === MENU_ITEM_TYPE.FORM) &&
                  (!value || value.trim() === '')
                ) {
                  return { message: 'Tabela é obrigatória' };
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tabela <span className="text-destructive">*</span>
                  </FieldLabel>
                  <TableCombobox
                    disabled={mode === 'show' || _update.status === 'pending'}
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value);
                    }}
                    placeholder="Selecione uma tabela..."
                    className={cn(isInvalid && 'border-destructive')}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Campo HTML - Condicional para tipo PAGE */}
        {menuType === MENU_ITEM_TYPE.PAGE && (
          <form.Field name="html">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Conteúdo da Página</FieldLabel>
                {mode === 'edit' && (
                  <div className="border rounded-md overflow-hidden">
                    <EditorExample
                      value={field.state.value || ''}
                      onChange={(value) => field.handleChange(value)}
                    />
                  </div>
                )}
                {mode === 'show' && (
                  <div className="border rounded-md p-4 bg-muted min-h-25">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: field.state.value || '<p>Sem conteúdo</p>',
                      }}
                    />
                  </div>
                )}
              </Field>
            )}
          </form.Field>
        )}

        {/* Campo URL - Condicional para tipo EXTERNAL */}
        {menuType === MENU_ITEM_TYPE.EXTERNAL && (
          <form.Field
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
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    URL <span className="text-destructive">*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      disabled={mode === 'show' || _update.status === 'pending'}
                      id={field.name}
                      name={field.name}
                      type="url"
                      placeholder="https://exemplo.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    <InputGroupAddon>
                      <LinkIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        {/* Info para tipo SEPARATOR */}
        {menuType === MENU_ITEM_TYPE.SEPARATOR && <SeparatorInfo />}

        {/* Campo Parent - Oculto para tipo SEPARATOR */}
        {menuType !== MENU_ITEM_TYPE.SEPARATOR && (
          <form.Field name="parent">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Menu Pai</FieldLabel>
                  <InputGroup>
                    <MenuCombobox
                      disabled={mode === 'show' || _update.status === 'pending'}
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value);
                      }}
                      placeholder="Nenhum (raiz)"
                      excludeId={data._id}
                      className={cn(isInvalid && 'border-destructive')}
                    />
                    <InputGroupAddon>
                      <FolderTreeIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        )}

        <Field className="inline-flex justify-end flex-1 items-end">
          <div className="inline-flex space-x-2 items-end justify-end">
            {mode === 'show' && (
              <Button
                type="button"
                className="w-full max-w-3xs"
                onClick={() => setMode('edit')}
              >
                <span>Editar</span>
              </Button>
            )}

            {mode === 'edit' && (
              <div className="inline-flex space-x-2 items-end justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full max-w-3xs"
                  disabled={_update.status === 'pending'}
                  onClick={() => {
                    form.reset();
                    setMode('show');
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="submit"
                  className="w-full max-w-3xs"
                  disabled={_update.status === 'pending'}
                >
                  {_update.status === 'pending' && <Spinner />}
                  <span>Salvar</span>
                </Button>
              </div>
            )}
          </div>
        </Field>
      </section>
    </form>
  );
}
