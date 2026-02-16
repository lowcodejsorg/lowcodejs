import React from 'react';

import { ForumUserMultiSelect } from './forum-user-multi-select';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

interface ForumAddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  isPending: boolean;
  labelValue: string;
  requiresMembers: boolean;
  requiresPrivacy: boolean;
  onCancel: () => void;
}

export function ForumAddChannelDialog({
  open,
  onOpenChange,
  form,
  isPending,
  labelValue,
  requiresMembers,
  requiresPrivacy,
  onCancel,
}: ForumAddChannelDialogProps): React.JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
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
            {requiresPrivacy && (
              <form.AppField name="privacy">
                {(field: any) => (
                  <Select
                    value={
                      typeof field.state.value === 'string'
                        ? field.state.value
                        : 'publico'
                    }
                    onValueChange={(value) => {
                      field.handleChange(value);
                      field.handleBlur();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Privacidade do canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </form.AppField>
            )}
            {requiresMembers && (
              <form.AppField name="members">
                {(field: any) => (
                  <ForumUserMultiSelect
                    value={
                      Array.isArray(field.state.value) ? field.state.value : []
                    }
                    onChange={(value) => field.handleChange(value)}
                    disabled={isPending}
                    placeholder="Selecione membros"
                  />
                )}
              </form.AppField>
            )}
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
