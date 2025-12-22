import { useForm, useStore } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { FileTextIcon, FolderTreeIcon, LinkIcon } from 'lucide-react';
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
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useCreateMenu } from '@/integrations/tanstack-query/implementations/use-menu-create';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MENU_ITEM_TYPE, MetaDefault } from '@/lib/constant';
import type { IMenu, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

const MenuTypeOptions = [
  { value: MENU_ITEM_TYPE.TABLE, label: 'Tabela' },
  { value: MENU_ITEM_TYPE.PAGE, label: 'Página' },
  { value: MENU_ITEM_TYPE.FORM, label: 'Formulário' },
  { value: MENU_ITEM_TYPE.EXTERNAL, label: 'Link Externo' },
  { value: MENU_ITEM_TYPE.SEPARATOR, label: 'Separador' },
];

export function CreateMenuForm(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const _create = useCreateMenu({
    onSuccess(data) {
      queryClient.setQueryData<Paginated<IMenu>>(
        ['/menu/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: {
              ...cached.meta,
              total: cached.meta.total + 1,
            },
            data: [data, ...cached.data],
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['/menu'],
      });

      toast('Menu criado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O menu foi criado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      navigate({ to: '/menus', search: { page: 1, perPage: 50 } });
      sidebar.setOpen(true);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        toast('Erro ao criar o menu', {
          className: '!bg-destructive !text-white !border-destructive',
          description: data?.message ?? 'Erro ao criar o menu',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      type: 'separator' as keyof typeof MENU_ITEM_TYPE,
      table: '',
      html: '',
      url: '',
      parent: '',
    },
    onSubmit: async ({ value }) => {
      if (_create.status === 'pending') return;

      await _create.mutateAsync({
        ...value,
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
                    disabled={_create.status === 'pending'}
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
              if (value.trim() === '') {
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
                  disabled={_create.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    const newType = value as keyof typeof MENU_ITEM_TYPE;
                    field.handleChange(newType);

                    form.setFieldValue('table', '');
                    form.setFieldValue('html', '');
                    form.setFieldValue('url', '');
                    form.setFieldValue('parent', '');
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
                      disabled={_create.status === 'pending'}
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value);
                      }}
                      placeholder="Nenhum (raiz)"
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

        {/* Campo Tabela - Condicional para tipos TABLE e FORM */}
        {[MENU_ITEM_TYPE.TABLE, MENU_ITEM_TYPE.FORM].includes(menuType) && (
          <form.Field
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
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tabela <span className="text-destructive">*</span>
                  </FieldLabel>
                  <TableCombobox
                    disabled={_create.status === 'pending'}
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
          <form.Field
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
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Conteúdo da Página
                  </FieldLabel>
                  <div
                    className={cn(
                      'border rounded-md overflow-hidden',
                      isInvalid && 'border-destructive',
                    )}
                  >
                    <EditorExample
                      value={field.state.value || ''}
                      onChange={(value) => field.handleChange(value)}
                    />
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
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
                      disabled={_create.status === 'pending'}
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

        <Field className="inline-flex justify-end flex-1 items-end">
          <div className="inline-flex space-x-2 items-end justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-3xs"
              disabled={_create.status === 'pending'}
              onClick={() => {
                navigate({ to: '/menus', search: { page: 1, perPage: 50 } });
              }}
            >
              <span>Cancelar</span>
            </Button>
            <Button
              type="submit"
              className="w-full max-w-3xs"
              disabled={_create.status === 'pending'}
            >
              {_create.status === 'pending' && <Spinner />}
              <span>Criar</span>
            </Button>
          </div>
        </Field>
      </section>
    </form>
  );
}
