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
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

type RowDeleteDialogProps = React.ComponentProps<typeof DialogTrigger> & {
  rowId: string;
  slug: string;
};

export function RowDeleteDialog({
  rowId,
  slug,
  ...props
}: RowDeleteDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const sidebar = useSidebar();
  const navigate = useNavigate();

  const deleteRow = useMutation({
    mutationFn: async function () {
      const route = '/tables/'.concat(slug).concat('/rows/').concat(rowId);
      await API.delete(route);
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
        'Registro excluído permanentemente!',
        'O registro foi excluído permanentemente',
      );

      sidebar.setOpen(false);
      navigate({
        to: '/tables/$slug',
        replace: true,
        params: { slug },
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao excluir registro' });
    },
  });

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger {...props} />
      <DialogContent
        className="py-4 px-6"
        data-test-id="delete-row-dialog"
      >
        <DialogHeader>
          <DialogTitle>Excluir registro permanentemente</DialogTitle>
          <DialogDescription>
            Essa ação é irreversível. O registro será excluído permanentemente e
            não poderá ser recuperado.
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
                data-test-id="delete-row-confirm-btn"
                disabled={deleteRow.status === 'pending'}
                onClick={() => {
                  deleteRow.mutateAsync();
                }}
              >
                {deleteRow.status === 'pending' && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {!(deleteRow.status === 'pending') && <span>Confirmar</span>}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
