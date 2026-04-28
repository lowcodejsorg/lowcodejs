import { LoaderCircleIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import React from 'react';

import { useMathCaptcha } from './use-math-captcha';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type PermanentDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  title: string;
  description: string;
  itemsCount: number;
  isPending: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
  testId?: string;
};

export function PermanentDeleteConfirmDialog(
  props: PermanentDeleteConfirmDialogProps,
): React.JSX.Element {
  const captcha = useMathCaptcha();
  const [answer, setAnswer] = React.useState('');

  React.useEffect(
    function () {
      if (!props.open) {
        setAnswer('');
        captcha.regenerate();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.open],
  );

  const trimmed = answer.trim();
  const isCaptchaValid =
    trimmed.length > 0 && Number(trimmed) === captcha.expected;
  const confirmLabel = props.confirmLabel ?? 'Excluir permanentemente';

  function handleRegenerate(): void {
    captcha.regenerate();
    setAnswer('');
  }

  function handleConfirm(): void {
    if (!isCaptchaValid) return;
    if (props.isPending) return;
    props.onConfirm();
  }

  return (
    <Dialog
      modal
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent
        className="py-4 px-6"
        data-test-id={props.testId}
      >
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive flex gap-2 items-start">
          <TriangleAlertIcon className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-sm">
            <strong>Esta ação não pode ser desfeita.</strong>
            {props.itemsCount > 0 && (
              <span>
                {props.itemsCount === 1 && '1 item será excluído permanentemente.'}
                {props.itemsCount > 1 && (
                  <React.Fragment>
                    {props.itemsCount} itens serão excluídos permanentemente.
                  </React.Fragment>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="permanent-delete-captcha">
            Para confirmar, responda: {captcha.question}
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="permanent-delete-captcha"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite a resposta"
              disabled={props.isPending}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRegenerate}
              disabled={props.isPending}
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
              disabled={props.isPending}
              data-test-id="permanent-delete-cancel"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={!isCaptchaValid || props.isPending}
            onClick={handleConfirm}
            data-test-id="permanent-delete-confirm"
          >
            {props.isPending && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!props.isPending && <span>{confirmLabel}</span>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
