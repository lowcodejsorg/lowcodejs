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

      toastSuccess(
        'Tabela excluída permanentemente!',
        'A tabela foi excluída permanentemente',
      );

      navigate({
        to: '/tables',
        replace: true,
        search: { page: 1, perPage: 50 },
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao excluir tabela' });
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
        data-test-id="delete-table-dialog"
      >
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
                <Button
                  className="bg-destructive hover:bg-destructive"
                  data-test-id="delete-table-cancel-btn"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="button"
                data-test-id="delete-table-confirm-btn"
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
