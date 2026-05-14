import { useMutation } from '@tanstack/react-query';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { API } from '@/lib/api';
import { handleApiError } from '@/lib/handle-api-error';
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';

type ImportFileV1 = {
  header: { platform: string; tableName?: string; exportType?: string; version?: string; exportedBy?: string; exportedAt?: string };
  structure?: { name?: string; slug?: string };
  data?: { totalRows: number };
};

type ImportFileV2 = {
  header: {
    platform: string;
    tableName?: string;
    version?: string;
    exportType?: string;
    tablesCount?: number;
    menusCount?: number;
    exportedBy?: string;
    exportedAt?: string;
  };
  tables: Array<{
    structure?: { name: string; slug: string; fields?: unknown[]; groups?: unknown[] };
    data?: { totalRows: number };
  }>;
  menus: Array<{ slug: string; name: string }>;
};

type ImportFileContent = ImportFileV1 | ImportFileV2;

function isV2(file: ImportFileContent): file is ImportFileV2 {
  return Array.isArray((file as ImportFileV2).tables);
}

function summarizeFile(file: ImportFileContent): {
  tables: Array<{ name: string; slug: string; rows: number }>;
  menus: Array<{ slug: string; name: string }>;
  totalFields: number;
} {
  if (isV2(file)) {
    const tables = file.tables.map((t) => ({
      name: t.structure?.name ?? '—',
      slug: t.structure?.slug ?? '—',
      rows: t.data?.totalRows ?? 0,
    }));
    const totalFields = file.tables.reduce((acc, t) => {
      const top = t.structure?.fields?.length ?? 0;
      const grp = (t.structure?.groups ?? []).reduce(
        (a: number, g) =>
          a + ((g as { fields?: unknown[] }).fields?.length ?? 0),
        0,
      );
      return acc + top + grp;
    }, 0);
    return { tables, menus: file.menus ?? [], totalFields };
  }
  const legacy = file as ImportFileV1;
  const struct = legacy.structure as {
    name?: string;
    slug?: string;
    fields?: unknown[];
    groups?: Array<{ fields?: unknown[] }>;
  } | undefined;
  const top = struct?.fields?.length ?? 0;
  const grp = (struct?.groups ?? []).reduce(
    (a, g) => a + (g.fields?.length ?? 0),
    0,
  );
  return {
    tables: [
      {
        name: struct?.name ?? legacy.header.tableName ?? '—',
        slug: struct?.slug ?? '—',
        rows: legacy.data?.totalRows ?? 0,
      },
    ],
    menus: [],
    totalFields: top + grp,
  };
}

export function ImportTableSection(): React.JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = React.useState<ImportFileContent | null>(
    null,
  );
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [tableName, setTableName] = React.useState('');
  const [conflicts, setConflicts] = React.useState<{
    tables: Array<string>;
    menus: Array<string>;
  } | null>(null);
  const navigate = useNavigate();

  const isMultiTable =
    fileContent !== null && isV2(fileContent) && fileContent.tables.length > 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    setFileError(null);
    setFileContent(null);
    setTableName('');
    setConflicts(null);

    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setFileError('O arquivo deve ser um JSON (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event): void => {
      try {
        const parsed = JSON.parse(
          event.target?.result as string,
        ) as ImportFileContent;

        if (!parsed.header || parsed.header.platform !== 'lowcodejs') {
          setFileError(
            'Arquivo inválido. O arquivo deve ter sido exportado pela plataforma LowCodeJS.',
          );
          return;
        }

        const summary = summarizeFile(parsed);
        if (summary.tables.length === 0) {
          setFileError(
            'O arquivo não contém estrutura de tabela. Exporte com a opção "Estrutura" habilitada.',
          );
          return;
        }

        setFileContent(parsed);
        const firstName = summary.tables[0].name;
        setTableName(firstName);
      } catch {
        setFileError('Erro ao ler o arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const importTable = useMutation({
    mutationFn: async function (): Promise<{
      tableId: string;
      slug: string;
      importedFields: number;
      importedRows: number;
      importedMenus: number;
      tables: Array<{ tableId: string; slug: string; name: string }>;
    }> {
      const body: Record<string, unknown> = { fileContent };
      if (!isMultiTable && tableName.trim()) body.name = tableName.trim();
      const response = await API.post('/tools/import-table', body);
      return response.data;
    },
    onSuccess(data) {
      setFileContent(null);
      setTableName('');
      setConflicts(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      QueryClient.invalidateQueries({ queryKey: queryKeys.tables.lists() });
      QueryClient.invalidateQueries({ queryKey: queryKeys.menus.all });

      toastSuccess(
        'Importação concluída!',
        `${data.tables.length} tabela(s), ${data.importedFields} campo(s), ${data.importedRows} registro(s) e ${data.importedMenus} item(ns) de menu`,
      );

      if (data.tables.length === 1) {
        navigate({
          to: '/tables/$slug',
          params: { slug: data.slug },
        });
      }
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao importar tabela',
        causeHandlers: {
          IMPORT_CONFLICTS: (errorData) => {
            setConflicts({
              tables: (errorData.errors?.tables ?? '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean),
              menus: (errorData.errors?.menus ?? '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean),
            });
          },
          TABLE_SLUG_ALREADY_EXISTS: () => {
            setConflicts({
              tables: [tableName],
              menus: [],
            });
          },
        },
      });
    },
  });

  const summary = fileContent ? summarizeFile(fileContent) : null;
  const isPending = importTable.status === 'pending';

  const canImport =
    Boolean(fileContent) &&
    (isMultiTable || tableName.trim().length > 0) &&
    !conflicts;

  return (
    <Card data-test-id="import-table-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="size-5" />
          Importar tabela(s)
        </CardTitle>
        <CardDescription>
          Carregue um arquivo JSON exportado pela plataforma. Suporta pacotes
          com várias tabelas, relacionamentos e itens de menu.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="import-file">Arquivo JSON</Label>
          <Input
            ref={fileInputRef}
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={isPending}
            className="cursor-pointer"
          />
        </div>

        {fileError && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {fileContent && summary && (
          <div className="space-y-3 p-3 rounded-md border bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircleIcon className="size-4" />
              <span className="font-medium">Arquivo válido</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Exportado por:</span>
                <p className="font-medium">
                  {fileContent.header.exportedBy ?? '—'}
                </p>
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
                <span className="text-muted-foreground">Tabelas:</span>
                <p className="font-medium">{summary.tables.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Campos:</span>
                <p className="font-medium">{summary.totalFields}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Menus:</span>
                <p className="font-medium">{summary.menus.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">
                  {fileContent.header.exportedAt
                    ? new Date(fileContent.header.exportedAt).toLocaleDateString(
                        'pt-BR',
                      )
                    : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t text-sm">
              <div className="text-muted-foreground">Conteúdo:</div>
              <ul className="space-y-0.5">
                {summary.tables.map((t) => (
                  <li
                    key={t.slug}
                    className="flex items-center gap-2 font-mono text-xs"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground">/{t.slug}</span>
                    {t.rows > 0 && (
                      <span className="text-muted-foreground">
                        — {t.rows} registro(s)
                      </span>
                    )}
                  </li>
                ))}
                {summary.menus.length > 0 && (
                  <li className="pt-1 text-xs text-muted-foreground">
                    + {summary.menus.length} item(ns) de menu
                  </li>
                )}
              </ul>
            </div>

            {!isMultiTable && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="import-table-name">Nome da nova tabela</Label>
                <Input
                  id="import-table-name"
                  value={tableName}
                  onChange={(e) => {
                    setTableName(e.target.value);
                    setConflicts(null);
                  }}
                  placeholder="Nome da tabela"
                  maxLength={40}
                  disabled={isPending}
                />
              </div>
            )}

            {isMultiTable && (
              <p className="pt-2 text-xs text-muted-foreground border-t">
                Importação multi-tabela: nomes e slugs originais serão
                preservados.
              </p>
            )}
          </div>
        )}

        {conflicts && (
          <div className="space-y-2 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="size-4 mt-0.5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">
                  Conflitos de slug — nada foi importado
                </p>
                {conflicts.tables.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Tabelas: </span>
                    <span className="font-mono text-xs">
                      {conflicts.tables.join(', ')}
                    </span>
                  </p>
                )}
                {conflicts.menus.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Menus: </span>
                    <span className="font-mono text-xs">
                      {conflicts.menus.join(', ')}
                    </span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Renomeie os itens existentes (ou descarte-os) e tente
                  novamente.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            data-test-id="import-table-submit-btn"
            disabled={!canImport || isPending}
            onClick={() => {
              setConflicts(null);
              importTable.mutate();
            }}
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <UploadIcon className="size-4" />
            )}
            <span>Importar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
