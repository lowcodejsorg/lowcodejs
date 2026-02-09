import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { useAppForm } from '@/integrations/tanstack-form/form-hook';

type AddChannelForm = ReturnType<typeof useAppForm>;

interface ForumAddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AddChannelForm;
  isPending: boolean;
  labelValue: string;
  onCancel: () => void;
}

export function ForumAddChannelDialog({
  open,
  onOpenChange,
  form,
  isPending,
  labelValue,
  onCancel,
}: ForumAddChannelDialogProps): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Novo canal</DialogTitle>
            <DialogDescription>
              Crie um canal para organizar as mensagens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <form.AppField name="label">
              {(field: any) => (
                <Input
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Nome do canal"
                  autoFocus
                />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field: any) => (
                <Textarea
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Descrição (opcional)"
                  className="min-h-[96px]"
                />
              )}
            </form.AppField>
          </div>
          <DialogFooter className="mt-3 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!labelValue.trim() || isPending}
            >
              {isPending && <Spinner />}
              <span>Criar</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
