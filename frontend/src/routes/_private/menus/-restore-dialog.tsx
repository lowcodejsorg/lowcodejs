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
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

interface MenuRestoreDialogProps
  extends React.ComponentProps<typeof DialogTrigger> {
  menuId: string;
}

export function MenuRestoreDialog({
  menuId,
  ...props
}: MenuRestoreDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const restore = useMutation({
    mutationFn: async function () {
      const route = '/menu/'.concat(menuId).concat('/restore');
      await API.patch(route);
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.menus.all,
      });

      toastSuccess('Menu restaurado!', 'O menu foi restaurado da lixeira');
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao restaurar menu da lixeira' });
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
          <DialogTitle>Restaurar menu da lixeira</DialogTitle>
          <DialogDescription>
            Ao confirmar essa ação, o menu será restaurado da lixeira
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
                disabled={restore.status === 'pending'}
                onClick={() => {
                  restore.mutateAsync();
                }}
              >
                {restore.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(restore.status === 'pending') && <span>Confirmar</span>}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
