import { useMutation } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import React from 'react';

import { PermanentDeleteConfirmDialog } from '@/components/common/permanent-delete-confirm-dialog';
import { Button } from '@/components/ui/button';
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
          : result.deleted
              .toString()
              .concat(' registros excluídos permanentemente'),
      );
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao esvaziar lixeira' });
    },
  });

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="py-1 px-2 h-auto inline-flex gap-1"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="size-4" />
        <span>Esvaziar lixeira</span>
      </Button>

      <PermanentDeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Esvaziar lixeira"
        description="Essa ação é irreversível. Todos os registros na lixeira serão excluídos permanentemente e não poderão ser recuperados."
        itemsCount={0}
        isPending={emptyTrash.isPending}
        onConfirm={() => emptyTrash.mutate()}
        testId="empty-trash-rows-dialog"
      />
    </>
  );
}
