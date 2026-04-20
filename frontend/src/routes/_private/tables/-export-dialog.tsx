import { useMutation } from '@tanstack/react-query';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { API } from '@/lib/api';
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

type Props = React.ComponentProps<typeof DialogTrigger> & {
  slug: string;
  tableName: string;
};

export function TableExportDialog({
  slug,
  tableName,
  children,
  ...props
}: Props): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [includeStructure, setIncludeStructure] = React.useState(true);
  const [includeData, setIncludeData] = React.useState(false);

  const exportType = React.useMemo(() => {
    if (includeStructure && includeData) return 'full';
    if (includeData) return 'data';
    return 'structure';
  }, [includeStructure, includeData]);

  const canExport = includeStructure || includeData;

  const exportTable = useMutation({
    mutationFn: async function () {
      const response = await API.post('/tools/export-table', {
        slug,
        exportType,
      });
      return response.data;
    },
    onSuccess(data) {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}-${exportType}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setOpen(false);
      toastSuccess(
        'Tabela exportada com sucesso!',
        `Arquivo ${link.download} baixado`,
      );
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao exportar tabela' });
    },
  });

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        asChild
        {...props}
      >
        {children ?? (
          <button
            type="button"
            className="sr-only"
            aria-hidden
          />
        )}
      </DialogTrigger>
      <DialogContent
        className="py-4 px-6 max-w-md"
        data-test-id="export-table-dialog"
      >
        <DialogHeader>
          <DialogTitle>Exportar tabela</DialogTitle>
          <DialogDescription>
            Selecione o que deseja exportar da tabela{' '}
            <strong>{tableName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <section className="py-4 space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="export-structure"
              checked={includeStructure}
              onCheckedChange={(checked) =>
                setIncludeStructure(checked === true)
              }
            />
            <div>
              <Label
                htmlFor="export-structure"
                className="text-sm font-medium cursor-pointer"
              >
                Estrutura
              </Label>
              <p className="text-xs text-muted-foreground">
                Campos, grupos, configuracoes e layout
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="export-data"
              checked={includeData}
              onCheckedChange={(checked) => setIncludeData(checked === true)}
            />
            <div>
              <Label
                htmlFor="export-data"
                className="text-sm font-medium cursor-pointer"
              >
                Dados
              </Label>
              <p className="text-xs text-muted-foreground">
                Registros da tabela (exceto arquivos e relacionamentos)
              </p>
            </div>
          </div>
        </section>
        <DialogFooter className="inline-flex w-full gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            data-test-id="export-table-submit-btn"
            disabled={!canExport || exportTable.status === 'pending'}
            onClick={() => {
              exportTable.mutateAsync();
            }}
          >
            {exportTable.status === 'pending' ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            <span>Exportar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
