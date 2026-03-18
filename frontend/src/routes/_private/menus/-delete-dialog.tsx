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
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

interface MenuDeleteDialogProps extends React.ComponentProps<
  typeof DialogTrigger
> {
  menuId: string;
}

export function MenuDeleteDialog({
  menuId,
  ...props
}: MenuDeleteDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const deleteMenu = useMutation({
    mutationFn: async function () {
      const route = '/menu/'.concat(menuId).concat('/permanent');
      await API.delete(route);
    },
    onSuccess() {
      setOpen(false);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.menus.all,
      });

      toastSuccess(
        'Menu excluído permanentemente!',
        'O menu foi excluído permanentemente',
      );

      navigate({
        to: '/menus',
        replace: true,
        search: { page: 1, perPage: 50 },
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao excluir menu' });
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
          <DialogTitle>Excluir menu permanentemente</DialogTitle>
          <DialogDescription>
            Essa ação é irreversível. O menu será excluído permanentemente e não
            poderá ser recuperado.
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
                disabled={deleteMenu.status === 'pending'}
                onClick={() => {
                  deleteMenu.mutateAsync();
                }}
              >
                {deleteMenu.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(deleteMenu.status === 'pending') && <span>Confirmar</span>}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
