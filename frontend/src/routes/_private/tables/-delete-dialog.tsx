import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { LoaderCircleIcon } from 'lucide-react';
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
import { QueryClient } from '@/lib/query-client';

type TableDeleteDialogProps = React.ComponentProps<typeof DialogTrigger> & {
  slug: string;
};

export function TableDeleteDialog({
  slug,
  ...props
}: TableDeleteDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const deleteTable = useMutation({
    mutationFn: async function () {
      const route = '/tables/'.concat(slug);
      await API.delete(route);
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(slug),
      });

      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });

      toast('Tabela excluída permanentemente!', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi excluída permanentemente',
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

        if (data?.code === 500 && data?.cause === 'DELETE_TABLE_ERROR') {
          toast.error(data?.message ?? 'Erro ao excluir tabela');
        }

        if (data?.code === 500 && data?.cause !== 'DELETE_TABLE_ERROR') {
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
      <DialogTrigger {...props} />
      <DialogContent className="py-4 px-6">
        <DialogHeader>
          <DialogTitle>Excluir tabela permanentemente</DialogTitle>
          <DialogDescription>
            Essa ação é irreversível. A tabela será excluída permanentemente e
            não poderá ser recuperada.
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
                disabled={deleteTable.status === 'pending'}
                onClick={() => {
                  deleteTable.mutateAsync();
                }}
              >
                {deleteTable.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(deleteTable.status === 'pending') && <span>Confirmar</span>}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
