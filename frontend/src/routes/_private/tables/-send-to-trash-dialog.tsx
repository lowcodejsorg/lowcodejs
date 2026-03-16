import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LoaderCircleIcon } from 'lucide-react';
import React from 'react';

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
import { handleApiError } from '@/lib/handle-api-error';
import type { ITable } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

type TableSendToTrashDialogProps = React.ComponentProps<
  typeof DialogTrigger
> & {
  slug: string;
};

export function TableSendToTrashDialog({
  slug,
  ...props
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
        queryKey: queryKeys.tables.detail(slug),
      });

      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });

      toastSuccess(
        'Tabela enviada para lixeira!',
        'A tabela foi movida para a lixeira',
      );

      navigate({
        to: '/tables',
        replace: true,
        search: { page: 1, perPage: 50 },
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao enviar tabela para lixeira' });
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
