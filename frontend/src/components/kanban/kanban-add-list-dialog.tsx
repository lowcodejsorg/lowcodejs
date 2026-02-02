import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function KanbanAddListDialog({
  open,
  onOpenChange,
  label,
  onLabelChange,
  color,
  onColorChange,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  onLabelChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar lista</DialogTitle>
          <DialogDescription>Crie uma nova coluna no kanban.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={label}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Ex: Revisao"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Cor</label>
            <input
              type="color"
              value={color}
              onChange={(event) => onColorChange(event.target.value)}
              className="h-8 w-12 rounded border bg-transparent p-0"
            />
            <span className="text-xs text-muted-foreground">{color}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={onSubmit}
            disabled={!label.trim() || isSubmitting}
          >
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
