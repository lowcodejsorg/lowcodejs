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

export function DocumentSidebarAddDialog({
  open,
  onOpenChange,
  parentLabel,
  value,
  onValueChange,
  onCancel,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentLabel: string | null;
  value: string;
  onValueChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPending: boolean;
}): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova seção</DialogTitle>
          <DialogDescription>
            {parentLabel
              ? `Criar seção dentro de "${parentLabel}".`
              : 'Criar seção na raiz.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Nome da seção"
            autoFocus
          />
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || isPending}
          >
            {isPending && <Spinner />}
            <span>Criar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
