import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  LoaderCircleIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import React from 'react';

import { useMathCaptcha } from '@/components/common/permanent-delete-confirm-dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const captcha = useMathCaptcha();
  const [answer, setAnswer] = React.useState('');

  React.useEffect(
    function () {
      if (!open) {
        setAnswer('');
        captcha.regenerate();
      }
    },
    [open],
  );

  const trimmed = answer.trim();
  const isCaptchaValid =
    trimmed.length > 0 && Number(trimmed) === captcha.expected;

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

  function handleRegenerate(): void {
    captcha.regenerate();
    setAnswer('');
  }

  function handleConfirm(): void {
    if (!isCaptchaValid) return;
    if (deleteRow.isPending) return;
    deleteRow.mutateAsync();
  }

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

        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive flex gap-2 items-start">
          <TriangleAlertIcon className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-sm">
            <strong>Esta ação não pode ser desfeita.</strong>
            <span>1 registro será excluído permanentemente.</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="delete-row-captcha">
            Para confirmar, responda: {captcha.question}
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="delete-row-captcha"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite a resposta"
              disabled={deleteRow.isPending}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRegenerate}
              disabled={deleteRow.isPending}
              aria-label="Gerar nova pergunta"
              title="Gerar nova pergunta"
            >
              <RefreshCwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="inline-flex w-full gap-2 justify-end pt-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={deleteRow.isPending}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            data-test-id="delete-row-confirm-btn"
            disabled={!isCaptchaValid || deleteRow.isPending}
            onClick={handleConfirm}
          >
            {deleteRow.isPending && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!deleteRow.isPending && <span>Excluir permanentemente</span>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
