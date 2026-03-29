import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderCircleIcon,
  UploadIcon,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { API } from '@/lib/api';
import { handleApiError } from '@/lib/handle-api-error';
import type { ITable, Paginated } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

type ImportFileContent = {
  header: {
    version: string;
    platform: string;
    tableName: string;
    tableSlug: string;
    exportedBy: string;
    exportedAt: string;
    exportType: 'structure' | 'data' | 'full';
  };
  structure?: {
    name: string;
    fields: Array<{ name: string; type: string }>;
    groups: Array<{ name: string; fields: Array<{ name: string }> }>;
    [key: string]: unknown;
  };
  data?: {
    totalRows: number;
    rows: Array<Record<string, unknown>>;
  };
};

type Props = React.ComponentProps<typeof DialogTrigger>;

export function TableImportDialog({ ...props }: Props): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [fileContent, setFileContent] =
    React.useState<ImportFileContent | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [tableName, setTableName] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const tablesQuery = useQuery({
    queryKey: [...queryKeys.tables.lists(), 'import-check'],
    queryFn: async () => {
      const response = await API.get<Paginated<ITable>>('/tables', {
        params: { page: 1, perPage: 1000 },
      });
      return response.data;
    },
    enabled: open,
    staleTime: 0,
  });

  const existingSlugs = React.useMemo(() => {
    if (!tablesQuery.data?.data) return new Set<string>();
    return new Set(tablesQuery.data.data.map((t) => t.slug));
  }, [tablesQuery.data]);

  const checkNameConflict = React.useCallback(
    (name: string): boolean => {
      if (!name.trim()) return false;
      // Reproduce slugify logic: lower, strict (remove non-alphanumeric except hyphen), trim
      const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return existingSlugs.has(slug);
    },
    [existingSlugs],
  );

  const handleNameChange = (value: string): void => {
    setTableName(value);
    setNameError(null);

    if (value.trim() && checkNameConflict(value)) {
      setNameError('Ja existe uma tabela com este nome. Escolha outro nome.');
    }
  };

  // Re-validate when tables list loads (may arrive after user typed the name)
  React.useEffect(() => {
    if (tableName.trim() && checkNameConflict(tableName)) {
      setNameError('Ja existe uma tabela com este nome. Escolha outro nome.');
    } else if (nameError && tableName.trim()) {
      setNameError(null);
    }
  }, [existingSlugs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    setFileError(null);
    setFileContent(null);
    setTableName('');
    setNameError(null);

    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setFileError('O arquivo deve ser um JSON (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event): void => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        if (!parsed.header || parsed.header.platform !== 'lowcodejs') {
          setFileError(
            'Arquivo invalido. O arquivo deve ter sido exportado pela plataforma LowCodeJS.',
          );
          return;
        }

        if (!parsed.structure) {
          setFileError(
            'O arquivo nao contem a estrutura da tabela. Exporte com a opcao "Estrutura" habilitada.',
          );
          return;
        }

        setFileContent(parsed);

        const originalName = parsed.header.tableName;
        setTableName(originalName);

        if (checkNameConflict(originalName)) {
          setNameError(
            'Ja existe uma tabela com este nome. Escolha outro nome.',
          );
        }
      } catch {
        setFileError('Erro ao ler o arquivo. Verifique se e um JSON valido.');
      }
    };
    reader.readAsText(file);
  };

  const importTable = useMutation({
    mutationFn: async function () {
      const response = await API.post('/tools/import-table', {
        name: tableName,
        fileContent,
      });
      return response.data as {
        tableId: string;
        slug: string;
        importedFields: number;
        importedRows: number;
      };
    },
    onSuccess(data) {
      setOpen(false);
      setFileContent(null);
      setTableName('');
      setNameError(null);

      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });

      toastSuccess(
        'Tabela importada com sucesso!',
        `${data.importedFields} campos e ${data.importedRows} registros importados`,
      );

      navigate({
        to: '/tables/$slug',
        params: { slug: data.slug },
      });
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao importar tabela',
        causeHandlers: {
          TABLE_SLUG_ALREADY_EXISTS: () => {
            setNameError(
              'Ja existe uma tabela com este nome. Escolha outro nome.',
            );
          },
        },
      });
    },
  });

  const totalFields = React.useMemo(() => {
    if (!fileContent?.structure) return 0;
    const topLevel = fileContent.structure.fields?.length || 0;
    const groupFields = (fileContent.structure.groups || []).reduce(
      (acc, g) => acc + (g.fields?.length || 0),
      0,
    );
    return topLevel + groupFields;
  }, [fileContent]);

  const handleOpenChange = (newOpen: boolean): void => {
    setOpen(newOpen);
    if (!newOpen) {
      setFileContent(null);
      setFileError(null);
      setTableName('');
      setNameError(null);
    }
  };

  const canImport =
    fileContent &&
    tableName.trim() &&
    !nameError &&
    importTable.status !== 'pending';

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger {...props} />
      <DialogContent
        className="py-4 px-6 max-w-lg"
        data-test-id="import-table-dialog"
      >
        <DialogHeader>
          <DialogTitle>Importar tabela</DialogTitle>
          <DialogDescription>
            Selecione um arquivo JSON exportado pela plataforma para importar
            uma tabela.
          </DialogDescription>
        </DialogHeader>
        <section className="py-4 space-y-4">
          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="import-file">Arquivo JSON</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {/* Error message */}
          {fileError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* File preview */}
          {fileContent && (
            <div className="space-y-3 p-3 rounded-md border bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircleIcon className="size-4" />
                <span className="font-medium">Arquivo valido</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Tabela original:
                  </span>
                  <p className="font-medium">{fileContent.header.tableName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Exportado por:</span>
                  <p className="font-medium">{fileContent.header.exportedBy}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium">
                    {fileContent.header.exportType === 'full'
                      ? 'Estrutura + Dados'
                      : fileContent.header.exportType === 'structure'
                        ? 'Estrutura'
                        : 'Dados'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Campos:</span>
                  <p className="font-medium">{totalFields}</p>
                </div>
                {fileContent.data && (
                  <div>
                    <span className="text-muted-foreground">Registros:</span>
                    <p className="font-medium">{fileContent.data.totalRows}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">
                    {new Date(fileContent.header.exportedAt).toLocaleDateString(
                      'pt-BR',
                    )}
                  </p>
                </div>
              </div>

              {/* Table name input */}
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="import-table-name">Nome da nova tabela</Label>
                <Input
                  id="import-table-name"
                  value={tableName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nome da tabela"
                  maxLength={40}
                  className={
                    nameError
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }
                />
                {nameError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircleIcon className="size-3 shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
        <DialogFooter className="inline-flex w-full gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            data-test-id="import-table-submit-btn"
            disabled={!canImport}
            onClick={() => {
              importTable.mutateAsync();
            }}
          >
            {importTable.status === 'pending' ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <UploadIcon className="size-4" />
            )}
            <span>Importar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
