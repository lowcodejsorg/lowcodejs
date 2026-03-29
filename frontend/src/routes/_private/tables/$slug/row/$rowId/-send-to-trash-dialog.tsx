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
import { useSidebar } from '@/components/ui/sidebar';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { API } from '@/lib/api';
import { handleApiError } from '@/lib/handle-api-error';
import type { IRow } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

type RowSendToTrashDialogProps = React.ComponentProps<typeof DialogTrigger> & {
  rowId: string;
  slug: string;
};

export function RowSendToTrashDialog({
  rowId,
  slug,
  ...props
}: RowSendToTrashDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const sendToTrash = useMutation({
    mutationFn: async function () {
      const route = '/tables/'
        .concat(slug)
        .concat('/rows/')
        .concat(rowId)
        .concat('/trash');
      const response = await API.patch<IRow>(route);
      return response.data;
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.detail(slug, rowId),
      });

      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });

      toastSuccess(
        'Linha enviada para lixeira!',
        'A linha foi movida para a lixeira',
      );

      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug },
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao enviar linha para lixeira' });
    },
  });

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger {...props} />
      <DialogContent className="py-4 px-6" data-test-id="trash-row-dialog">
        <DialogHeader>
          <DialogTitle>Enviar linha para a lixeira</DialogTitle>
          <DialogDescription>
            Ao confirmar essa ação, a linha será enviada para a lixeira
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
                data-test-id="trash-row-confirm-btn"
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
