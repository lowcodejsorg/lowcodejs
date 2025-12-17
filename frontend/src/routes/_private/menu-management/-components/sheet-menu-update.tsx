import { TinyMCEEditor } from "@/components/common/tiny-mce-editor";
import type { SearchableOption } from "@/components/common/searchable-select";
import { TableSearchField } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { API } from "@/lib/api";
import { MENU_ITEM_TYPE, type Menu, type Paginated } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { MetaDefault } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const MenuMapper = [
  { value: "table", label: "Tabela" },
  { value: "page", label: "Página" },
  { value: "form", label: "Formulário da tabela" },
  { value: "external", label: "Link Externo" },
  { value: "separator", label: "Separador" },
] as const;

interface FormMenuUpdateProps {
  onClose: () => void;
  menu: Menu;
}

function FormMenuUpdate({ onClose, menu }: FormMenuUpdateProps) {
  const search = useSearch({
    from: "/_private/menu-management/",
  });

  // Buscar menus existentes para o campo "Item Pai"
  const menusQuery = useQuery({
    queryKey: ["/menu/paginated", search],
    queryFn: async () => {
      const response = await API.get<Paginated<Menu[]>>("/menu/paginated", {
        params: { ...search },
      });
      return response.data;
    },
  });

  const updateMenu = useMutation({
    mutationFn: async (payload: object) => {
      const route = "/menu/".concat(menu._id);
      const response = await API.put<Menu>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      onClose();

      QueryClient.setQueryData<Menu>(
        ["/menu/".concat(data._id), data._id],
        data
      );

      QueryClient.setQueryData<Paginated<Menu[]>>(
        ["/menu/paginated", search],
        (old) => {
          if (!old) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: old.meta,
            data: old.data.map((item) => {
              if (item._id === data._id) {
                return data;
              }
              return item;
            }),
          };
        }
      );

      QueryClient.invalidateQueries({
        queryKey: ["/menu"],
      });

      toast("Menu atualizado", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: "O menu foi atualizado com sucesso",
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "Dados inválidos");
        }

        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        if (data?.code === 404 && data?.cause === "MENU_NOT_FOUND") {
          toast.error(data?.message ?? "Menu não encontrado");
        }

        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(data?.message ?? "Tabela não encontrada");
        }

        if (data?.code === 404 && data?.cause === "PARENT_MENU_NOT_FOUND") {
          toast.error(data?.message ?? "Menu pai não encontrado");
        }

        if (data?.code === 409 && data?.cause === "MENU_ALREADY_EXISTS") {
          form.setError("name", {
            message: data?.message ?? "Este menu já existe",
          });
        }

        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const form = useForm();

  const watchType: MENU_ITEM_TYPE = form.watch("type");

  const onSubmit = form.handleSubmit(async (data) => {
    if (updateMenu.status === "pending") return;

    const [table] = Array.from<SearchableOption>(data.table || []);

    const payload: any = {};

    if (data.name) payload.name = data.name;
    if (data.type) payload.type = data.type;
    if (data.parent !== undefined) {
      payload.parent = data.parent === "none" ? null : data.parent;
    }
    if (table?.value) payload.table = table.value;
    if (data.html !== undefined) payload.html = data.html;
    if (data.url !== undefined) payload.url = data.url;

    await updateMenu.mutateAsync(payload);
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          rules={{
            validate: (value) => {
              if (value && !value.trim()) {
                return "Nome não pode estar vazio";
              }
              return true;
            },
          }}
          defaultValue={menu.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                Nome
              </FormLabel>
              <FormControl>
                <Input placeholder="Nome do menu" {...field} />
              </FormControl>
              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          defaultValue={menu.type}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                Tipo
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MenuMapper.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        {[MENU_ITEM_TYPE.FORM, MENU_ITEM_TYPE.TABLE].includes(
          watchType || menu.type
        ) && (
          <FormField
            control={form.control}
            name="table"
            defaultValue={
              menu.table
                ? [
                    {
                      label:
                        typeof menu.table === "object"
                          ? menu.table.name
                          : "Tabela",
                      value:
                        typeof menu.table === "object"
                          ? menu.table._id
                          : menu.table,
                    },
                  ]
                : []
            }
            render={({ field }) => <TableSearchField field={field} required />}
          />
        )}

        {[MENU_ITEM_TYPE.PAGE].includes(watchType || menu.type) && (
          <FormField
            control={form.control}
            name="html"
            defaultValue={menu.html || ""}
            render={({ field }) => (
              <TinyMCEEditor
                field={field}
                label="Conteúdo da Página"
                placeholder="Digite o conteúdo da página..."
                defaultValue={menu.html || ""}
                height={300}
              />
            )}
          />
        )}

        {[MENU_ITEM_TYPE.EXTERNAL].includes(watchType || menu.type) && (
          <FormField
            control={form.control}
            name="url"
            defaultValue={menu.url || ""}
            rules={{
              validate: (value) => {
                if (
                  [MENU_ITEM_TYPE.EXTERNAL].includes(watchType || menu.type) &&
                  !value
                ) {
                  return "URL é obrigatória para links externos";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="data-[error=true]:text-destructive">
                  URL Externa
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://exemplo.com"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage className="text-right text-destructive" />
              </FormItem>
            )}
          />
        )}

        {[MENU_ITEM_TYPE.SEPARATOR].includes(watchType || menu.type) && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Os separadores são usados apenas para agrupar visualmente itens de
              menu. Eles não precisam de configurações adicionais.
            </p>
          </div>
        )}

        {/* Item Pai - não exibir para separators */}
        {(watchType || menu.type) !== MENU_ITEM_TYPE.SEPARATOR && (
          <FormField
            control={form.control}
            name="parent"
            defaultValue={
              menu.parent
                ? typeof menu.parent === "object"
                  ? menu.parent._id
                  : menu.parent
                : "none"
            }
            render={({ field }) => {
              const availableParents =
                menusQuery.data?.data?.filter((menuItem) => {
                  // Não pode ser pai de si mesmo
                  if (menuItem._id === menu._id) return false;

                  // Sempre incluir separators
                  if (menuItem.type === "separator") return true;

                  // Incluir se não tem pai (item raiz)
                  if (!menuItem.parent) return true;

                  // Se tem pai, verificar se o pai NÃO é separator
                  const parent = menusQuery.data?.data?.find((item) => {
                    const itemId = item._id;
                    const parentId =
                      typeof menuItem.parent === "string"
                        ? menuItem.parent
                        : menuItem.parent?._id;
                    return itemId === parentId;
                  });

                  return parent?.type !== "separator";
                }) || [];

              return (
                <FormItem>
                  <FormLabel className="data-[error=true]:text-destructive">
                    Item Pai
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Nenhum (item raiz)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (item raiz)</SelectItem>
                      {availableParents.map((menuItem) => (
                        <SelectItem key={menuItem._id} value={menuItem._id}>
                          {menuItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-right text-destructive" />
                </FormItem>
              );
            }}
          />
        )}

        <div className="inline-flex flex-1 justify-end w-full">
          <Button type="submit" disabled={updateMenu.status === "pending"}>
            {updateMenu.status === "pending" && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!(updateMenu.status === "pending") && <span>Atualizar</span>}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface SheetMenuUpdateProps extends React.ComponentProps<
  typeof SheetTrigger
> {
  _id: string;
}

export function SheetMenuUpdate({ _id, ...props }: SheetMenuUpdateProps) {
  const [open, setOpen] = React.useState(false);

  const response = useQuery({
    queryKey: ["/menu/".concat(_id), _id],
    queryFn: async function () {
      const route = "/menu/".concat(_id);
      const response = await API.get<Menu>(route);
      return response.data;
    },
    enabled: Boolean(open) && Boolean(_id),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            Editar item de menu
          </SheetTitle>
          <SheetDescription>
            Atualize as informações do item de menu
          </SheetDescription>
        </SheetHeader>

        {response?.status === "success" && (
          <FormMenuUpdate onClose={() => setOpen(false)} menu={response.data} />
        )}
      </SheetContent>
    </Sheet>
  );
}
