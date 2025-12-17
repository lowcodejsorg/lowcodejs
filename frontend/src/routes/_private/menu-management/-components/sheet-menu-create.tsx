// import { RichTextEditor } from "@/components/common/rich-text-editor";
import type { SearchableOption } from "@/components/common/searchable-select";
import { TableSearchField } from "@/components/common/table-search";
// import { TinyMCEEditor } from "@/components/common/tiny-mce-editor";
import { Link, RichTextEditor } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
// import SubScript from "@tiptap/extension-subscript";
// import Superscript from "@tiptap/extension-superscript";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
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

interface FormProps {
  onClose: () => void;
}

function FormMenuCreate({ onClose }: FormProps) {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
      // Superscript,
      // SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
    ],
    // content: "",
    // onUpdate({ editor }) {
    //   const html = editor.getHTML();
    //   console.log("HTML: ", html);
    // },
  });

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

  const createMenu = useMutation({
    mutationFn: async (payload: object) => {
      const response = await API.post<Menu>("/menu", payload);
      return response.data;
    },
    onSuccess(data) {
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
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
            data: [data, ...old.data],
          };
        }
      );

      QueryClient.invalidateQueries({
        queryKey: ["/menu"],
      });

      toast("Menu criado", {
        className: "!bg-primary !text-primary-foreground !border-primary",
        description: "O menu foi criado com sucesso",
        descriptionClassName: "!text-primary-foreground",
        closeButton: true,
      });
      onClose();
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
    if (createMenu.status === "pending") return;

    const [table] = Array.from<SearchableOption>(data.table || []);

    await createMenu.mutateAsync({
      name: data.name,
      type: data.type,
      parent: data.parent === "none" ? null : data.parent,
      table: table?.value ?? null,
      html: data.html ?? null,
      url: data.url || null,
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          rules={{
            validate: (value) => {
              if (!value) {
                return "Nome é obrigatório";
              }
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                Nome
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={"Nome do menu"} {...field} />
              </FormControl>
              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          rules={{
            validate: (value) => {
              if (!value) {
                return "Tipo é obrigatório";
              }
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                Tipo
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={"Selecione o tipo"} />
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

        {[MENU_ITEM_TYPE.FORM, MENU_ITEM_TYPE.TABLE].includes(watchType) && (
          <FormField
            control={form.control}
            name="table"
            render={({ field }) => <TableSearchField field={field} required />}
          />
        )}

        {[MENU_ITEM_TYPE.PAGE].includes(watchType) && (
          <FormField
            control={form.control}
            name="html"
            render={({ field }) => (
              <RichTextEditor editor={editor}>
                <RichTextEditor.ColorPicker
                  colors={[
                    "#25262b",
                    "#868e96",
                    "#fa5252",
                    "#e64980",
                    "#be4bdb",
                    "#7950f2",
                    "#4c6ef5",
                    "#228be6",
                    "#15aabf",
                    "#12b886",
                    "#40c057",
                    "#82c91e",
                    "#fab005",
                    "#fd7e14",
                  ]}
                />
                <RichTextEditor.Toolbar
                  sticky
                  stickyOffset="var(--docs-header-height)"
                >
                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.ClearFormatting />
                    <RichTextEditor.Highlight />
                    <RichTextEditor.Code />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.H1 />
                    <RichTextEditor.H2 />
                    <RichTextEditor.H3 />
                    <RichTextEditor.H4 />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Blockquote />
                    <RichTextEditor.Hr />
                    <RichTextEditor.BulletList />
                    <RichTextEditor.OrderedList />
                    <RichTextEditor.Subscript />
                    <RichTextEditor.Superscript />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Link />
                    <RichTextEditor.Unlink />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.AlignLeft />
                    <RichTextEditor.AlignCenter />
                    <RichTextEditor.AlignJustify />
                    <RichTextEditor.AlignRight />
                  </RichTextEditor.ControlsGroup>

                  <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Undo />
                    <RichTextEditor.Redo />
                  </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>

                <RichTextEditor.Content />
              </RichTextEditor>
            )}
          />
        )}

        {[MENU_ITEM_TYPE.EXTERNAL].includes(watchType) && (
          <FormField
            control={form.control}
            name="url"
            rules={{
              validate: (value) => {
                if ([MENU_ITEM_TYPE.EXTERNAL].includes(watchType) && !value) {
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
                    placeholder={"https://exemplo.com"}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage className="text-right text-destructive" />
              </FormItem>
            )}
          />
        )}

        {/* Informação sobre separadores */}
        {[MENU_ITEM_TYPE.SEPARATOR].includes(watchType) && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Os separadores são usados apenas para agrupar visualmente itens de
              menu. Eles não precisam de configurações adicionais.
            </p>
          </div>
        )}

        {/* Item Pai - não exibir para separators */}
        {watchType !== MENU_ITEM_TYPE.SEPARATOR && (
          <FormField
            control={form.control}
            name="parent"
            render={({ field }) => {
              // Filtrar menus disponíveis como pais
              const availableParents =
                menusQuery.data?.data?.filter((menu) => {
                  // Sempre incluir separators
                  if (menu.type === "separator") return true;

                  // Incluir se não tem pai (item raiz)
                  if (!menu.parent) return true;

                  // Se tem pai, verificar se o pai NÃO é separator
                  const parent = menusQuery.data?.data?.find((item) => {
                    const itemId = item._id;
                    const parentId =
                      typeof menu.parent === "string"
                        ? menu.parent
                        : menu.parent?._id;
                    return itemId === parentId;
                  });

                  // EXCLUIR se o pai é separator
                  return parent?.type !== "separator";
                }) || [];

              return (
                <FormItem>
                  <FormLabel className="data-[error=true]:text-destructive">
                    Item Pai
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={"Nenhum (item raiz)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (item raiz)</SelectItem>
                      {availableParents.map((menu) => (
                        <SelectItem key={menu._id} value={menu._id}>
                          {menu.name}
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
          <Button type="submit" disabled={createMenu.status === "pending"}>
            {createMenu.status === "pending" && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!(createMenu.status === "pending") && <span>Criar</span>}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function SheetMenuCreate() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="py-1 px-2 h-auto inline-flex gap-1 cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>Novo menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-7xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            Novo item de menu
          </SheetTitle>
          <SheetDescription>
            Adicione um novo item ao menu de navegação
          </SheetDescription>
        </SheetHeader>

        <FormMenuCreate onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
