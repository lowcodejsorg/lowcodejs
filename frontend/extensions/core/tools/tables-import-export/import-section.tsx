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
import { cn } from '@/lib/utils';

type ImportFileV1 = {
  header: {
    platform: string;
    tableName?: string;
    exportType?: string;
    version?: string;
    exportedBy?: string;
    exportedAt?: string;
  };
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
    structure?: {
      name: string;
      slug: string;
      fields?: Array<unknown>;
      groups?: Array<unknown>;
    };
    data?: { totalRows: number };
  }>;
  menus: Array<{ slug: string; name: string }>;
};

type ImportFileContent = ImportFileV1 | ImportFileV2;

function isV2(file: ImportFileContent): file is ImportFileV2 {
  return Array.isArray((file as ImportFileV2).tables);
}

/**
 * Slug de pré-visualização. O backend é a fonte da verdade (usa `slugify` com
 * `strict`), mas isso aproxima o resultado para o usuário ver o efeito da
 * renomeação antes de importar.
 */
function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
          a + ((g as { fields?: Array<unknown> }).fields?.length ?? 0),
        0,
      );
      return acc + top + grp;
    }, 0);
    return { tables, menus: file.menus ?? [], totalFields };
  }
  const legacy = file;
  const struct = legacy.structure as
    | {
        name?: string;
        slug?: string;
        fields?: Array<unknown>;
        groups?: Array<{ fields?: Array<unknown> }>;
      }
    | undefined;
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
  const [fileContent, setFileContent] =
    React.useState<ImportFileContent | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  // Nome editável por tabela, chaveado pelo slug ORIGINAL do pacote.
  const [tableNames, setTableNames] = React.useState<Record<string, string>>(
    {},
  );
  // Nome editável por item de menu, chaveado pelo slug ORIGINAL do menu.
  const [menuNames, setMenuNames] = React.useState<Record<string, string>>({});
  const [conflicts, setConflicts] = React.useState<{
    tables: Array<string>;
    menus: Array<string>;
  } | null>(null);
  const navigate = useNavigate();

  const summary = fileContent ? summarizeFile(fileContent) : null;

  const resetState = (): void => {
    setFileError(null);
    setFileContent(null);
    setTableNames({});
    setMenuNames({});
    setConflicts(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    resetState();

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

        const parsedSummary = summarizeFile(parsed);
        if (parsedSummary.tables.length === 0) {
          setFileError(
            'O arquivo não contém estrutura de tabela. Exporte com a opção "Estrutura" habilitada.',
          );
          return;
        }

        setFileContent(parsed);
        setTableNames(
          Object.fromEntries(parsedSummary.tables.map((t) => [t.slug, t.name])),
        );
        setMenuNames(
          Object.fromEntries(parsedSummary.menus.map((m) => [m.slug, m.name])),
        );
      } catch {
        setFileError('Erro ao ler o arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const updateTableName = (originalSlug: string, value: string): void => {
    setTableNames((prev) => ({ ...prev, [originalSlug]: value }));
    setConflicts(null);
  };

  const updateMenuName = (originalSlug: string, value: string): void => {
    setMenuNames((prev) => ({ ...prev, [originalSlug]: value }));
    setConflicts(null);
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
      // Envia apenas as tabelas cujo nome foi de fato alterado — as demais
      // mantêm nome/slug originais. Relacionamentos são preservados pelo
      // backend independentemente da renomeação.
      const renamed = (summary?.tables ?? [])
        .map((t) => ({
          slug: t.slug,
          name: (tableNames[t.slug] ?? t.name).trim(),
        }))
        .filter((t) => t.name && t.name !== originalNameOf(t.slug));
      if (renamed.length > 0) body.tables = renamed;
      // Idem para itens de menu — só os renomeados. Menus-pai já existentes
      // são reaproveitados pelo backend; só os itens folha podem conflitar.
      const renamedMenus = (summary?.menus ?? [])
        .map((m) => ({
          slug: m.slug,
          name: (menuNames[m.slug] ?? m.name).trim(),
        }))
        .filter((m) => m.name && m.name !== originalMenuNameOf(m.slug));
      if (renamedMenus.length > 0) body.menus = renamedMenus;
      const response = await API.post('/tools/import-table', body);
      return response.data;
    },
    onSuccess(data) {
      resetState();
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
            applyConflicts(
              splitSlugs(errorData.errors?.tables),
              splitSlugs(errorData.errors?.menus),
            );
          },
          TABLE_SLUG_ALREADY_EXISTS: (errorData) => {
            applyConflicts(splitSlugs(errorData.errors?.tables), []);
          },
          DUPLICATE_TABLE_SLUGS: (errorData) => {
            applyConflicts(splitSlugs(errorData.errors?.tables), []);
          },
          DUPLICATE_MENU_SLUGS: (errorData) => {
            applyConflicts([], splitSlugs(errorData.errors?.menus));
          },
        },
      });
    },
  });

  function originalNameOf(originalSlug: string): string {
    return summary?.tables.find((t) => t.slug === originalSlug)?.name ?? '';
  }

  function originalMenuNameOf(originalSlug: string): string {
    return summary?.menus.find((m) => m.slug === originalSlug)?.name ?? '';
  }

  function splitSlugs(raw: string | undefined): Array<string> {
    return (raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Apenas marca os itens conflitantes (tabelas e menus). NÃO renomeia
  // automaticamente — o usuário escolhe o novo nome. Auto-preencher um
  // sufixo dava a falsa impressão de que o conflito persistia mesmo após
  // a sugestão aplicada.
  function applyConflicts(
    tableSlugs: Array<string>,
    menuSlugs: Array<string>,
  ): void {
    setConflicts({ tables: tableSlugs, menus: menuSlugs });
  }

  const isPending = importTable.status === 'pending';

  const allNamesFilled =
    summary !== null &&
    summary.tables.every((t) => (tableNames[t.slug] ?? '').trim().length > 0);

  const conflictingMenusFilled =
    conflicts === null ||
    conflicts.menus.every((slug) => (menuNames[slug] ?? '').trim().length > 0);

  const canImport =
    Boolean(fileContent) && allNamesFilled && conflictingMenusFilled;

  const conflictingTableSlugs = new Set(conflicts?.tables ?? []);
  const conflictingMenuSlugs = conflicts?.menus ?? [];

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
                    ? new Date(
                        fileContent.header.exportedAt,
                      ).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t text-sm">
              <div className="text-muted-foreground">
                Tabelas a importar — ajuste o nome se quiser (os relacionamentos
                entre as tabelas são preservados):
              </div>
              <ul className="space-y-3">
                {summary.tables.map((t) => {
                  const value = tableNames[t.slug] ?? t.name;
                  const previewSlug = toSlug(value) || t.slug;
                  const isConflicting = conflictingTableSlugs.has(t.slug);
                  return (
                    <li
                      key={t.slug}
                      className="space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`Nome da tabela ${t.name}`}
                          value={value}
                          onChange={(e) =>
                            updateTableName(t.slug, e.target.value)
                          }
                          placeholder="Nome da tabela"
                          maxLength={40}
                          disabled={isPending}
                          className={cn(
                            'h-8',
                            isConflicting &&
                              'border-destructive focus-visible:ring-destructive/40',
                          )}
                        />
                        {t.rows > 0 && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {t.rows} registro(s)
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'font-mono text-xs',
                          isConflicting
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        /{previewSlug}
                        {isConflicting && ' — já existe, escolha outro nome'}
                      </p>
                    </li>
                  );
                })}
                {summary.menus.length > 0 && (
                  <li className="pt-1 text-xs text-muted-foreground">
                    + {summary.menus.length} item(ns) de menu
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {conflicts && (
          <div className="space-y-3 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="size-4 mt-0.5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">
                  Conflitos de slug — nada foi importado
                </p>
                {conflicts.tables.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Renomeie a(s) tabela(s) destacada(s) acima e clique em
                    Importar novamente.
                  </p>
                )}
                {conflictingMenuSlugs.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Itens de menu já existentes. Ajuste o nome abaixo e importe
                    novamente — os menus-pai já existentes são reaproveitados
                    automaticamente.
                  </p>
                )}
              </div>
            </div>

            {conflictingMenuSlugs.length > 0 && (
              <ul className="space-y-3 pl-6">
                {conflictingMenuSlugs.map((slug) => {
                  const value =
                    menuNames[slug] ?? originalMenuNameOf(slug) ?? slug;
                  const previewSlug = toSlug(value) || slug;
                  return (
                    <li
                      key={slug}
                      className="space-y-1"
                    >
                      <Input
                        aria-label={`Nome do menu ${originalMenuNameOf(slug) || slug}`}
                        value={value}
                        onChange={(e) => updateMenuName(slug, e.target.value)}
                        placeholder="Nome do item de menu"
                        maxLength={120}
                        disabled={isPending}
                        className="h-8 border-destructive focus-visible:ring-destructive/40"
                      />
                      <p className="font-mono text-xs text-destructive">
                        /{previewSlug} — slug original: /{slug}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
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
