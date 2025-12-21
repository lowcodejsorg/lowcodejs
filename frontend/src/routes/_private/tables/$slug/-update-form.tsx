import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTable } from '@/integrations/tanstack-query/implementations/use-table-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import { ITable, Paginated } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useForm } from '@tanstack/react-form';
import { AxiosError } from 'axios';
import { AlignLeftIcon, FileTextIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import z from 'zod';

type UpdateTableFormProps = {
  data: ITable;
};

const TableUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres')
    .regex(
      /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
      'O nome não pode conter caracteres especiais',
    ),
  description: z.string().nullable().optional(),
  logoFile: z
    .array(z.custom<File>())
    .max(1, 'Selecione apenas 1 arquivo para logo')
    .optional(),
  logo: z.string().nullable().optional(),
});

export function UpdateTableForm({ data }: UpdateTableFormProps) {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useUpdateTable({
    onSuccess(updatedData) {
      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(updatedData.slug), updatedData.slug],
        updatedData,
      );
      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [updatedData],
            };
          }

          return {
            meta: cached.meta,
            data: cached.data.map((item) => {
              if (item._id === updatedData._id) {
                return {
                  ...item,
                  ...updatedData,
                };
              }

              return item;
            }),
          };
        },
      );

      toast('Tabela atualizada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados da tabela foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        toast('Erro ao atualizar a tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar a tabela',
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
      description: data.description ?? '',
      style: data.configuration.style,
      visibility: data.configuration.visibility,
      collaboration: data.configuration.collaboration,
      logo: data.logo?._id ?? null,
      logoFile: [] as File[],
    },
    onSubmit: async ({ value }) => {
      const validation = TableUpdateSchema.safeParse({
        name: value.name,
        description: value.description || null,
        logo: value.logo,
        logoFile: value.logoFile,
      });

      if (!validation.success) {
        console.error(validation.error);
        return;
      }

      if (_update.status === 'pending') return;

      // const visibility =
      //   Array.from<SelectOption>(payload?.configuration?.visibility) ?? [];

      //       const collaboration =
      //   Array.from<SelectOption>(payload?.configuration?.collaboration) ?? [];

      // const administrators =
      //   Array.from<SearchableOption>(payload.configuration?.administrators) ?? [];

      await _update.mutateAsync({
        ...data,
        name: value.name ?? data.name,
        description: value.description ?? null,
        logo: (value.logo || data.logo?._id) ?? null,
        configuration: {
          ...data.configuration,
          visibility: value.visibility,
          style: value.style,
          collaboration: value.collaboration,
          administrators: [],
        },
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <section className="space-y-4 p-2">
        {/* Campo Logo */}
        <form.Field
          name="logoFile"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Logo</FieldLabel>

                {mode === 'edit' && (
                  <FileUploadWithStorage
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    onStorageChange={([storage]) => {
                      console.log({
                        storage,
                      });
                      if (storage) {
                        form.setFieldValue('logo', storage._id);
                      }
                    }}
                    accept="image/*"
                    maxFiles={1}
                    maxSize={4 * 1024 * 1024}
                    placeholder="Arraste e solte a imagem do logo"
                    shouldDeleteFromStorage
                  />
                )}

                {data?.logo?.url && mode === 'show' && (
                  <div className="mt-2 p-2 border rounded-md">
                    <img
                      src={data?.logo?.url}
                      alt={data?.logo?.filename}
                      className="w-full h-32 object-contain"
                    />
                  </div>
                )}

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Campo Nome */}
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Nome é obrigatório' };
              }
              if (value.length > 40) {
                return { message: 'Nome deve ter no máximo 40 caracteres' };
              }
              if (
                !/^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/.test(value)
              ) {
                return {
                  message: 'O nome não pode conter caracteres especiais',
                };
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
                    placeholder="Digite o nome da tabela"
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

        {/* Campo Descrição */}
        <form.Field
          name="description"
          children={(field) => {
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
                <div className="relative">
                  <Textarea
                    disabled={mode === 'show' || _update.status === 'pending'}
                    id={field.name}
                    name={field.name}
                    placeholder="Digite uma descrição para a tabela"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                  />
                  <div className="absolute right-3 top-3 pointer-events-none opacity-50">
                    <AlignLeftIcon className="size-4" />
                  </div>
                </div>
              </Field>
            );
          }}
        />

        {/* Campo Style */}
        <form.Field
          name="style"
          children={(field) => (
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FieldLabel>Layout de visualização</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Defina como a tabela será exibida
                </p>
              </div>
              <div className="inline-flex space-x-2 items-center">
                <span className="text-sm text-muted-foreground">Lista</span>
                <Switch
                  disabled={mode === 'show' || _update.status === 'pending'}
                  checked={field.state.value === 'gallery'}
                  onCheckedChange={(checked) => {
                    field.handleChange(checked ? 'gallery' : 'list');
                  }}
                />
                <span className="text-sm text-muted-foreground">Galeria</span>
              </div>
            </div>
          )}
        />

        {/* Campo Visibility */}
        <form.Field
          name="visibility"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Visibilidade é obrigatória' };
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
                  Visibilidade <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  disabled={mode === 'show' || _update.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(
                      value as 'public' | 'restricted' | 'open' | 'form',
                    );
                  }}
                >
                  <SelectTrigger
                    className={cn(isInvalid && 'border-destructive')}
                  >
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Pública</SelectItem>
                    <SelectItem value="restricted">Restrita</SelectItem>
                    <SelectItem value="open">Aberta</SelectItem>
                    <SelectItem value="form">Formulário online</SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        {/* Campo Collaboration */}
        <form.Field
          name="collaboration"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Colaboração é obrigatória' };
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
                  Colaboração <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  disabled={mode === 'show' || _update.status === 'pending'}
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as 'open' | 'restricted');
                  }}
                >
                  <SelectTrigger
                    className={cn(isInvalid && 'border-destructive')}
                  >
                    <SelectValue placeholder="Selecione o modo de colaboração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restricted">Restrita</SelectItem>
                    <SelectItem value="open">Aberta</SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <Field className="inline-flex justify-end flex-1 items-end">
          {mode === 'show' && (
            <Button
              type="button"
              className="w-full max-w-3xs"
              onClick={() => {
                setMode('edit');
              }}
            >
              <span>Editar</span>
            </Button>
          )}

          {mode === 'edit' && (
            <div className="inline-flex space-x-2 items-end justify-end">
              <Button
                type="reset"
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
        </Field>
      </section>
    </form>
  );
}
