import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
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
import { API } from '@/lib/api';
import type { ITable } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';

interface TableSendToTrashDialogProps {
  slug: string;
}

export function TableSendToTrashDialog({
  slug,
}: TableSendToTrashDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const sendToTrash = useMutation({
    mutationFn: async function () {
      const route = '/tables/'.concat(slug).concat('/trash');
      const response = await API.patch<ITable>(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: ['/tables/'.concat(slug)],
      });

      QueryClient.invalidateQueries({
        queryKey: ['/tables/paginated'],
      });

      toast('Tabela enviada para lixeira!', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi movida para a lixeira',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      navigate({
        to: '/tables',
        replace: true,
        search: { page: 1, perPage: 50 },
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

        if (data?.code === 409 && data?.cause === 'ALREADY_TRASHED') {
          toast.error(data?.message ?? 'Tabela já está na lixeira');
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
          <Trash2Icon className="size-4" />
          <span>Enviar para lixeira</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="py-4 px-6">
        <DialogHeader>
          <DialogTitle>Enviar tabela para a lixeira</DialogTitle>
          <DialogDescription>
            Ao confirmar essa ação, a tabela será enviada para a lixeira
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
                disabled={sendToTrash.status === 'pending'}
                onClick={() => {
                  sendToTrash.mutateAsync();
                }}
              >
                {sendToTrash.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(sendToTrash.status === 'pending') && <span>Confirmar</span>}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
