import { useMutation } from '@tanstack/react-query';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import React from 'react';

import { TableCombobox } from '@/components/common/dynamic-table/table-selectors/table-combobox';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { API } from '@/lib/api';
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

export function ExportTableSection(): React.JSX.Element {
  const [tableId, setTableId] = React.useState<string>('');
  const [tableSlug, setTableSlug] = React.useState<string>('');
  const [includeStructure, setIncludeStructure] = React.useState(true);
  const [includeData, setIncludeData] = React.useState(false);

  const exportType = React.useMemo(() => {
    if (includeStructure && includeData) return 'full';
    if (includeData) return 'data';
    return 'structure';
  }, [includeStructure, includeData]);

  const canExport = Boolean(tableSlug) && (includeStructure || includeData);

  const exportTable = useMutation({
    mutationFn: async function () {
      const response = await API.post('/tools/export-table', {
        slug: tableSlug,
        exportType,
      });
      return response.data;
    },
    onSuccess(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tableSlug}-${exportType}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toastSuccess(
        'Tabela exportada com sucesso!',
        `Arquivo ${link.download} baixado`,
      );
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao exportar tabela' });
    },
  });

  const isPending = exportTable.status === 'pending';

  return (
    <Card data-test-id="export-table-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DownloadIcon className="size-5" />
          Exportar tabela
        </CardTitle>
        <CardDescription>
          Selecione a tabela e o que deseja incluir no arquivo JSON.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>Tabela</FieldLabel>
          <TableCombobox
            value={tableId}
            onValueChange={(value, slug) => {
              setTableId(value);
              setTableSlug(slug ?? '');
            }}
            placeholder="Selecione uma tabela..."
            disabled={isPending}
          />
        </Field>

        <Field>
          <FieldLabel>Conteúdo</FieldLabel>
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="export-structure"
                checked={includeStructure}
                onCheckedChange={(checked) =>
                  setIncludeStructure(checked === true)
                }
                disabled={isPending}
              />
              <div>
                <Label
                  htmlFor="export-structure"
                  className="text-sm font-medium cursor-pointer"
                >
                  Estrutura
                </Label>
                <p className="text-xs text-muted-foreground">
                  Campos, grupos, configurações e layout
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="export-data"
                checked={includeData}
                onCheckedChange={(checked) => setIncludeData(checked === true)}
                disabled={isPending}
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
          </div>
        </Field>

        <div className="flex justify-end">
          <Button
            type="button"
            data-test-id="export-table-submit-btn"
            disabled={!canExport || isPending}
            onClick={() => {
              exportTable.mutateAsync();
            }}
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            <span>Exportar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
