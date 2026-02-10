import { useMutation } from '@tanstack/react-query';
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
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';

interface TableRemoveFromTrashDialogProps {
  slug: string;
}

export function TableRemoveFromTrashDialog({
  slug,
}: TableRemoveFromTrashDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const removeFromTrash = useMutation({
    mutationFn: async function () {
      const route = '/tables/'.concat(slug).concat('/restore');
      const response = await API.patch<ITable>(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(slug),
      });

      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });

      toast('Tabela restaurada!', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi restaurada da lixeira',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 401 && data?.cause === 'AUTHENTICATION_REQUIRED') {
          toast.error(data?.message ?? 'Autenticação necessária');
        }

        if (data?.code === 404 && data?.cause === 'TABLE_NOT_FOUND') {
          toast.error(data?.message ?? 'Tabela não encontrada');
        }

        if (data?.code === 409 && data?.cause === 'NOT_TRASHED') {
          toast.error(data?.message ?? 'Tabela não está na lixeira');
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
          <span>Restaurar da lixeira</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="py-4 px-6">
        <DialogHeader>
          <DialogTitle>Restaurar tabela da lixeira</DialogTitle>
          <DialogDescription>
            Ao confirmar essa ação, a tabela será restaurada da lixeira
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
