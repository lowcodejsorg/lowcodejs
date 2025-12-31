import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArchiveRestoreIcon, LoaderCircleIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSidebar } from '@/components/ui/sidebar';
import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';

interface RowRemoveFromTrashDialogProps {
  rowId: string;
  slug: string;
}

export function RowRemoveFromTrashDialog({
  rowId,
  slug,
}: RowRemoveFromTrashDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const removeFromTrash = useMutation({
    mutationFn: async function () {
      const route = '/tables/'
        .concat(slug)
        .concat('/rows/')
        .concat(rowId)
        .concat('/restore');
      const response = await API.patch<IRow>(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug).concat('/rows/').concat(rowId)],
      });

      QueryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug).concat('/rows/paginated')],
      });

      toast('Linha restaurada!', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A linha foi restaurada da lixeira',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 400 && data?.cause === 'INVALID_PARAMETERS') {
          toast.error(data?.message ?? 'ID do registro inválido');
        }

        if (data?.code === 401 && data?.cause === 'AUTHENTICATION_REQUIRED') {
          toast.error(data?.message ?? 'Autenticação necessária');
        }

        if (data?.code === 403 && data?.cause === 'ACCESS_DENIED') {
          toast.error(data?.message ?? 'Acesso negado');
        }

        if (data?.code === 404 && data?.cause === 'ROW_NOT_FOUND') {
          toast.error(data?.message ?? 'Registro não encontrado na lixeira');
        }

        if (data?.code === 500) {
          toast.error(data?.message ?? 'Erro interno do servidor');
        }
      }

      console.error(error);
    },
  });

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <ArchiveRestoreIcon className="size-4" />
          <span>Remover da lixeira</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="py-4 px-6">
        <DialogHeader>
          <DialogTitle>Restaurar linha da lixeira</DialogTitle>
          <DialogDescription>
            Ao confirmar essa ação, a linha será restaurada da lixeira
          </DialogDescription>
        </DialogHeader>
        <section>
          <form className="pt-4 pb-2">
            <DialogFooter className="inline-flex w-full gap-2 justify-end">
              <DialogClose asChild>
                <Button className="bg-destructive hover:bg-destructive">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={removeFromTrash.status === 'pending'}
                onClick={() => {
                  removeFromTrash.mutateAsync();
                }}
              >
                {removeFromTrash.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(removeFromTrash.status === 'pending') && (
                  <span>Confirmar</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
