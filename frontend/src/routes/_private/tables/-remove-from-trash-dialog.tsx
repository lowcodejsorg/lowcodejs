import { useMutation } from '@tanstack/react-query';
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

type TableRemoveFromTrashDialogProps = React.ComponentProps<
  typeof DialogTrigger
> & {
  slug: string;
};

export function TableRemoveFromTrashDialog({
  slug,
  ...props
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

      toastSuccess('Tabela restaurada!', 'A tabela foi restaurada da lixeira');
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao restaurar tabela da lixeira' });
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
