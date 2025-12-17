import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API } from "@/lib/api";
import type { Menu, Paginated } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface MenuDeleteDialogProps extends React.ComponentProps<
  typeof DialogTrigger
> {
  _id: string;
}

interface MenuData extends Menu {
  children?: ChildMenu[];
}

interface ChildMenu {
  _id: string;
  name: string;
  type: string;
}

export function DialogMenuDelete({ _id, ...props }: MenuDeleteDialogProps) {
  const search = useSearch({
    from: "/_private/menu-management/",
  });

  const [open, setOpen] = React.useState(false);
  const [showChildrenWarning, setShowChildrenWarning] = React.useState(false);
  const [childrenList, setChildrenList] = React.useState<ChildMenu[]>([]);

  // Buscar dados do menu para ter acesso aos children
  const menuQuery = useQuery({
    queryKey: ["/menu/".concat(_id), _id],
    queryFn: async function () {
      const route = "/menu/".concat(_id);
      const response = await API.get<MenuData>(route);
      return response.data;
    },
    enabled: Boolean(open) && Boolean(_id),
  });

  const deleteMenu = useMutation({
    mutationFn: async function () {
      const route = "/menu/".concat(_id);
      const response = await API.delete(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);
      setShowChildrenWarning(false);

      QueryClient.setQueryData<Paginated<Menu[]>>(
        ["/menu/paginated", search],
        (old) => {
          if (!old) return old;
          return {
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            data: old.data.filter((item) => item._id !== _id),
          };
        }
      );

      QueryClient.invalidateQueries({
        queryKey: ["/menu"],
      });

      toast("Menu enviado para lixeira", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: "O menu foi movido para a lixeira e pode ser recuperado",
        descriptionClassName: "!text-white",
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 409 - SEPARATOR_HAS_CHILDREN
        if (data?.code === 409 && data?.cause === "SEPARATOR_HAS_CHILDREN") {
          setShowChildrenWarning(true);
          // Usar dados do menuQuery ao invés de tentar buscar do erro
          setChildrenList(menuQuery.data?.children || []);
          return; // Não fechar o dialog, mostrar aviso
        }

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "Dados inválidos");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - MENU_NOT_FOUND
        if (data?.code === 404 && data?.cause === "MENU_NOT_FOUND") {
          toast.error(data?.message ?? "Menu não encontrado");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const handleCloseDialog = () => {
    setOpen(false);
    setShowChildrenWarning(false);
    setChildrenList([]);
  };

  const typeLabels: Record<string, string> = {
    table: "Tabela",
    page: "Página",
    form: "Formulário",
    external: "Link Externo",
    separator: "Separador",
  };

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hidden" {...props} />
      <DialogContent className="py-4 px-6">
        {!showChildrenWarning ? (
          // Dialog padrão para delete normal
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Enviar menu para lixeira
              </DialogTitle>
              <DialogDescription>
                O menu será movido para a lixeira e poderá ser recuperado
                posteriormente. Esta ação não é permanente.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="inline-flex w-full gap-2 justify-end pt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMenu.status === "pending"}
                onClick={() => {
                  deleteMenu.mutateAsync();
                }}
              >
                {deleteMenu.status === "pending" && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(deleteMenu.status === "pending") && (
                  <span>Enviar para Lixeira</span>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Dialog de aviso para separator com filhos
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Separator possui sub-itens
              </DialogTitle>
              <DialogDescription>
                Este separator não pode ser deletado pois possui sub-itens
                ativos. Delete primeiro todos os sub-itens listados abaixo:
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="font-medium text-red-800 mb-3">
                  Sub-itens encontrados ({childrenList.length}):
                </h4>
                <ul className="space-y-2">
                  {childrenList.map((child) => (
                    <li
                      key={child._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span className="font-medium">{child.name}</span>
                      <span className="text-red-600">
                        ({typeLabels[child.type] || child.type})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <Button onClick={handleCloseDialog}>Entendi</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
