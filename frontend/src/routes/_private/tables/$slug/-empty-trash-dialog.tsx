import { useMutation } from '@tanstack/react-query';
import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
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
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

interface RowEmptyTrashDialogProps {
  slug: string;
}

export function RowEmptyTrashDialog({
  slug,
}: RowEmptyTrashDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const emptyTrash = useMutation({
    mutationFn: async function () {
      const route = '/tables/'.concat(slug).concat('/rows/empty-trash');
      const response = await API.delete<{ deleted: number }>(route);
      return response.data;
    },
    onSuccess(result) {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });

      toastSuccess(
        'Lixeira esvaziada!',
        result.deleted === 1
          ? '1 registro excluído permanentemente'
          : `${result.deleted} registros excluídos permanentemente`,
      );
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao esvaziar lixeira' });
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
          variant="destructive"
          size="sm"
          className="py-1 px-2 h-auto inline-flex gap-1"
        >
          <Trash2Icon className="size-4" />
          <span>Esvaziar lixeira</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="py-4 px-6"
        data-test-id="empty-trash-rows-dialog"
      >
        <DialogHeader>
          <DialogTitle>Esvaziar lixeira</DialogTitle>
          <DialogDescription>
            Essa ação é irreversível. Todos os registros na lixeira serão
            excluídos permanentemente e não poderão ser recuperados.
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
                disabled={emptyTrash.status === 'pending'}
                onClick={() => {
                  emptyTrash.mutateAsync();
                }}
              >
                {emptyTrash.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(emptyTrash.status === 'pending') && <span>Confirmar</span>}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
