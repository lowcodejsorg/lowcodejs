# Skill: Relatorio PDF (Frontend)

O relatorio PDF e o padrao para gerar documentos PDF no frontend. O fluxo e: Dialog com filtros → `useMutation` para buscar dados da API → funcao geradora que usa `PDFBuilder` → download automatico. Existem 7 relatorios no codebase, todos seguindo a mesma arquitetura: um componente Dialog com filtros, um arquivo de geracao que orquestra o `PDFBuilder`, e a classe `PDFBuilder` que encapsula o jsPDF com metodos reutilizaveis para header, filtros, listas, tabelas e page breaks.

---

## Estrutura do Arquivo

```
frontend/
  src/
    components/
      common/
        dialog-[entities]-report.tsx             <-- Dialog com filtros + mutation
    lib/
      pdf-builder.ts                             <-- Classe PDFBuilder (jsPDF wrapper)
      reports/
        [entities]-report.ts                     <-- Funcao geradora do PDF
```

- O Dialog de filtros vive em `components/common/dialog-[entities]-report.tsx`.
- A funcao geradora vive em `lib/reports/[entities]-report.ts`.
- `PDFBuilder` e compartilhado por todos os relatorios.

---

## Template: Dialog de Relatorio

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { API } from '@/lib/api';
import { generate{{Entities}}ReportPDF } from '@/lib/reports/{{entities}}-report';

export function Dialog{{Entities}}Report(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  // Outros filtros: const [filterId, setFilterId] = useState('');

  const generateReport = useMutation({
    mutationFn: async () => {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
      if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
      // if (filterId && filterId !== 'ALL') params.filter_id = filterId;

      const response = await API.get('/reports/{{entities}}', { params });
      return response.data;
    },
    onSuccess(data) {
      const userName = profile.data?.name || 'Usuario';
      generate{{Entities}}ReportPDF(data, userName);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><FileDown /> Relatorio</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Relatorio de {{Entities}}</DialogTitle>
        </DialogHeader>

        {/* Filtros: DatePicker, Select, Combobox */}

        <DialogFooter>
          <Button onClick={() => generateReport.mutate()} disabled={generateReport.status === 'pending'}>
            {generateReport.status === 'pending' ? (
              <><Spinner /> Gerando...</>
            ) : (
              <><FileDown /> Baixar PDF</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Template: Funcao Geradora

```typescript
import { PDFBuilder } from '../pdf-builder';

export interface {{Entities}}ReportData {
  summary: {
    total: number;
    // metricas especificas
  };
  by_category: Array<{ name: string; count: number; percentage: number }>;
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
  generated_at: string;
}

export async function generate{{Entities}}ReportPDF(
  data: {{Entities}}ReportData,
  userName: string,
): Promise<void> {
  const pdf = new PDFBuilder();

  // 1. Header com logo
  await pdf.renderHeader('Relatorio de {{Entities}}', userName);

  // 2. Filtros aplicados
  const filters: Array<{ label: string; value: string }> = [];
  if (data.filters.start_date && data.filters.end_date) {
    filters.push({ label: 'Periodo', value: `${data.filters.start_date} ate ${data.filters.end_date}` });
  }
  pdf.renderFilters(filters);

  // 3. Resumo
  pdf.renderSectionTitle('Resumo');
  pdf.renderList([
    { label: 'Total', value: data.summary.total },
  ]);

  // 4. Tabela
  pdf.renderTable(
    '{{Entities}} por Categoria',
    [
      { header: 'Categoria', key: 'name', width: 75 },
      { header: 'Quantidade', key: 'count', width: 45 },
      { header: 'Porcentagem', key: 'percentage', width: 45, format: (v) => `${v}%` },
    ],
    data.by_category,
  );

  // 5. Download
  pdf.save('relatorio-{{entities}}.pdf');
}
```

---

## Exemplo Real

```typescript
// lib/reports/artisans-report.ts (trecho)
export async function generateArtisansReportPDF(
  data: ArtisansReportData,
  userName: string,
): Promise<void> {
  const pdf = new PDFBuilder();

  await pdf.renderHeader('Relatorio de Artesaos', userName);

  const filters: Array<{ label: string; value: string }> = [];
  if (data.filters.start_date && data.filters.end_date) {
    filters.push({
      label: 'Periodo',
      value: `${formatDate(data.filters.start_date)} ate ${formatDate(data.filters.end_date)}`,
    });
  }
  pdf.renderFilters(filters);

  pdf.renderSectionTitle('Resumo');
  pdf.renderList([
    { label: 'Total de artesaos', value: data.summary.total_artisans },
    { label: 'Artesaos aprovados', value: data.summary.approved_artisans },
    { label: 'Artesaos pendentes', value: data.summary.pending_artisans },
  ]);

  pdf.renderSectionTitle('Solicitacoes de Atualizacao');
  pdf.renderSubSection('Por status', [
    { label: 'Pendentes', value: data.update_requests.by_status.PENDING },
    { label: 'Aprovados', value: data.update_requests.by_status.APPROVED },
    { label: 'Rejeitados', value: data.update_requests.by_status.REJECTED },
  ]);

  pdf.renderTable('Artesaos por Aldeia',
    [
      { header: 'Aldeia', key: 'name', width: 75 },
      { header: 'Quantidade', key: 'count', width: 45 },
      { header: 'Porcentagem', key: 'percentage', width: 45, format: (v) => `${v}%` },
    ],
    data.by_village,
  );

  pdf.save('relatorio-artesaos.pdf');
}
```

**Leitura do exemplo:**

1. `PDFBuilder` e instanciado uma vez e todos os metodos `render*` sao chamados em sequencia.
2. `renderHeader` e async pois carrega a imagem do logo como base64.
3. `renderFilters` so renderiza filtros que foram efetivamente aplicados (verificacao de null).
4. `renderList` recebe array de `{ label, value }` para metricas de resumo.
5. `renderTable` aceita colunas com `format` customizado (ex.: adicionar `%` a porcentagem).
6. `pdf.save('filename.pdf')` dispara o download no browser automaticamente.

---

## API PDFBuilder

```typescript
class PDFBuilder {
  constructor();
  async renderHeader(title: string, userName: string): Promise<void>;
  renderFilters(filters: Array<{ label: string; value: string }>): void;
  renderSectionTitle(title: string): void;
  renderList(items: Array<{ label: string; value: string | number; indent?: number; bold?: boolean }>): void;
  renderSubSection(title: string, items: Array<{ label: string; value: string | number }>): void;
  renderTable<T>(title: string, columns: Array<{ header: string; key: string; width?: number; format?: (v: unknown) => string }>, data: T[], maxRows?: number): void;
  addSpace(space?: number): void;
  save(filename: string): void;
}
```

---

## Regras e Convencoes

1. **Dialog → Mutation → PDF → Download** -- o fluxo e sempre: Dialog com filtros, `useMutation` para buscar dados, funcao geradora para montar PDF, `save()` para download.

2. **Filtros como query params** -- os filtros do Dialog sao enviados como query params no formato `yyyy-MM-dd` para datas, string para IDs.

3. **Funcao geradora async** -- a funcao `generate*ReportPDF` e async por causa do `renderHeader` (carrega logo). Sempre usar `await`.

4. **Interface tipada para dados** -- cada relatorio define sua interface de dados (`*ReportData`) com `summary`, `filters` e `generated_at`.

5. **Filtros condicionais** -- so adicione ao array de filtros do PDF os filtros que foram efetivamente aplicados (verificar null/undefined).

6. **Nome semantico no save** -- use `relatorio-[entidade].pdf` como nome do arquivo baixado.

7. **Loading state no botao** -- o botao de download mostra `<Spinner /> Gerando...` durante a mutation.

8. **Fechar dialog apos sucesso** -- chamar `setOpen(false)` no `onSuccess` da mutation.

9. **Separacao de responsabilidades** -- Dialog gerencia UI e filtros, funcao geradora gerencia layout do PDF, `PDFBuilder` gerencia primitivas jsPDF.

10. **Usar `PDFBuilder` existente** -- nunca instancie `jsPDF` diretamente. Sempre use a classe `PDFBuilder` de `lib/pdf-builder.ts`.

---

## Checklist

- [ ] Dialog esta em `components/common/dialog-[entities]-report.tsx`.
- [ ] Funcao geradora esta em `lib/reports/[entities]-report.ts`.
- [ ] Dialog usa `useMutation` para buscar dados (nao `useQuery`).
- [ ] Filtros sao enviados como query params.
- [ ] Funcao geradora usa `PDFBuilder` (nao jsPDF diretamente).
- [ ] Interface de dados (`*ReportData`) esta definida no arquivo da funcao.
- [ ] `renderHeader` e chamado com `await`.
- [ ] Botao mostra loading state durante geracao.
- [ ] Dialog fecha apos download (`setOpen(false)` no `onSuccess`).
- [ ] Nome do arquivo segue `relatorio-[entidade].pdf`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| PDF sem logo | `renderHeader` chamado sem `await` | Adicionar `await pdf.renderHeader(...)` |
| Download nao inicia | `pdf.save()` nao chamado | Verificar que `save()` e a ultima chamada na funcao |
| Filtros vazios no PDF | Filtros nao verificados para null | Checar `data.filters.field !== null` antes de adicionar |
| Dados cortados na pagina | `checkPageBreak` nao chamado | `PDFBuilder` gerencia automaticamente; verificar se metodos estao em sequencia |
| Dialog nao fecha | Faltou `setOpen(false)` no `onSuccess` | Adicionar ao callback de sucesso |
| Tipo errado nos dados | Interface nao corresponde a resposta da API | Verificar interface `*ReportData` contra endpoint `/reports/*` |

---

**Cross-references:** ver [037-skill-endpoint-relatorio.md](./037-skill-endpoint-relatorio.md), [029-skill-sheet-dialog-crud.md](./029-skill-sheet-dialog-crud.md).
