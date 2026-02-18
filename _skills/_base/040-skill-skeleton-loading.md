# Skill: Skeleton/Loading Pattern

O Skeleton e o padrao para estados de carregamento. Cada componente de dados (tabela, dashboard, sheet view, formulario) possui um Skeleton pareado que replica sua estrutura visual com placeholders animados. Existem dois padroes: **inline** (Skeleton dentro do proprio componente, controlado por `query.status`) e **extraido** (componente separado em arquivo proprio). O Skeleton base usa Tailwind `animate-pulse` com `bg-accent` e e composivel via `className`.

---

## Estrutura do Arquivo

```
frontend/
  src/
    components/
      ui/
        skeleton.tsx                              <-- Componente base (shadcn)
      common/
        dashboard/
          dashboard-skeleton.tsx                  <-- Skeleton composto (StatCard + PendingCard)
          index.ts                               <-- Re-export
    routes/
      _private/
        [role]/
          [entity]/
            -components/
              table-[entities]-skeleton.tsx        <-- Skeleton de tabela (extraido)
              sheet-view-[entity]/
                sheet-view-[entity]-skeleton.tsx   <-- Skeleton de sheet view (extraido)
              sheet-update-[entity]/
                form-update-[entity]-skeleton.tsx  <-- Skeleton de formulario (extraido)
```

- O componente base vive em `components/ui/skeleton.tsx`.
- Skeletons compostos (dashboard) vivem em `components/common/`.
- Skeletons de feature (tabela, sheet, form) vivem em `-components/` junto ao componente real.

---

## Template: Componente Base

```typescript
// components/ui/skeleton.tsx
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
```

## Template: Skeleton de Tabela (Extraido)

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function Table{{Entities}}Skeleton(): React.JSX.Element {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          <TableHead>Coluna 1</TableHead>
          <TableHead>Coluna 2</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-12" /></TableCell>
            <TableCell className="w-20"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Template: Skeleton de Dashboard (Composto)

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCardSkeleton(): React.JSX.Element {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingCardSkeleton(): React.JSX.Element {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-12" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardSkeletonProps {
  statCards?: number;
  pendingCards?: number;
}

export function DashboardSkeleton({
  statCards = 4,
  pendingCards = 3,
}: DashboardSkeletonProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: statCards }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: pendingCards }).map((_, i) => (
            <PendingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Template: Skeleton de Sheet View (Extraido)

```typescript
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function SheetView{{Entity}}Skeleton(): React.JSX.Element {
  return (
    <div className="grid gap-6 py-4">
      <Skeleton className="h-5 w-24 rounded-full" />

      <div className="grid gap-4">
        <Skeleton className="h-4 w-32" />
        <Separator />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid gap-4">
        <Skeleton className="h-4 w-40" />
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

## Template: Skeleton de Formulario (Extraido)

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export function FormUpdate{{Entity}}Skeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Campo texto */}
      <div className="grid gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Campo select */}
      <div className="grid gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Campo textarea */}
      <div className="grid gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Botao submit */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
```

---

## Exemplo Real

```typescript
// routes/_private/administrator/index.tsx (trecho) — Dashboard
import { DashboardSkeleton, StatCard, PendingCard } from '@/components/common/dashboard';

function RouteComponent(): React.JSX.Element {
  const stats = useQuery({
    queryKey: ['/stats/administrator'],
    queryFn: async () => {
      const response = await API.get<AdministratorStats>('/stats/administrator');
      return response.data;
    },
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto relative p-4">
      {stats.isLoading ? (
        <DashboardSkeleton statCards={4} pendingCards={3} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} title="Artesaos" value={stats.data?.artisans.total ?? 0} />
          </div>
        </div>
      )}
    </div>
  );
}
```

```typescript
// routes/_private/administrator/pieces/-components/sheet-view-piece/index.tsx (trecho) — Sheet View
export function SheetViewPiece({ pieceId }: SheetViewPieceProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const query = useQuery({
    queryKey: ['/pieces/'.concat(pieceId), pieceId],
    queryFn: async () => {
      const response = await API.get<IPiece>('/pieces/'.concat(pieceId));
      return response.data;
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        {query.status === 'pending' && <SheetViewPieceSkeleton />}
        {query.status === 'error' && <LoadError message="Erro ao carregar" />}
        {query.status === 'success' && <PieceDetails piece={query.data} />}
      </SheetContent>
    </Sheet>
  );
}
```

**Leitura do exemplo:**

1. O Dashboard usa ternario: `isLoading ? <Skeleton /> : <Content />`. Este e o padrao inline.
2. O Sheet View usa status-based rendering: `pending` → Skeleton, `error` → LoadError, `success` → dados. Este e o padrao extraido.
3. `DashboardSkeleton` recebe props configuráveis (`statCards`, `pendingCards`) para adaptar ao numero de cards.
4. Cada Skeleton deve replicar o layout do componente real (mesmos grids, gaps, tamanhos).
5. `Array.from({ length: N }).map((_, i) => ...)` e o padrao para gerar N linhas/cards de skeleton.

---

## Padroes de Integracao com React Query

### Padrao 1: Ternario (Dashboard)

```typescript
{stats.isLoading ? <DashboardSkeleton /> : <DashboardContent data={stats.data} />}
```

### Padrao 2: Status-based (Sheet/Table)

```typescript
{pagination.status === 'pending' && <TableSkeleton />}
{pagination.status === 'success' && <Table data={pagination.data.data} />}
```

### Padrao 3: Inline (Publico)

```typescript
{isLoading && Array.from({ length: 12 }).map((_, i) => (
  <div key={i} className="h-[400px] w-full bg-background-card animate-pulse rounded-none" />
))}
```

---

## Tamanhos Padrao de Skeleton

| Elemento | Classe | Uso |
|----------|--------|-----|
| Label | `h-4 w-12` a `w-24` | Labels de campos |
| Input | `h-10 w-full` | Campos de texto |
| Textarea | `h-24 w-full` | Campos multiline |
| Titulo | `h-6 w-48` | Titulos de secao |
| Subtitulo | `h-4 w-32` a `w-64` | Textos de descricao |
| Badge | `h-5 w-24 rounded-full` | Status badges |
| Avatar | `h-12 w-12 rounded-lg` | Icones/avatares |
| Imagem | `h-32 w-full rounded-lg` | Thumbnails |
| Botao acao | `h-8 w-8 rounded-full` | Botoes de dropdown |
| Botao submit | `h-10 w-full` | Botoes de formulario |

---

## Regras e Convencoes

1. **Skeleton pareado com componente** -- todo componente de dados (tabela, dashboard, sheet, form) deve ter um Skeleton correspondente que replica sua estrutura.

2. **Mesma estrutura de layout** -- o Skeleton deve usar os mesmos grids, gaps e containers do componente real para evitar layout shift.

3. **`Array.from({ length: N })`** -- use este padrao para gerar linhas/items repetidos no Skeleton. N deve ser razoavel (10 para tabelas, 4 para grids).

4. **Arquivo separado para Skeletons de feature** -- tabelas, sheets e forms devem ter seus Skeletons em arquivo separado (`*-skeleton.tsx`) na mesma pasta.

5. **Skeletons compostos para dashboards** -- dashboards usam Skeletons compostos (`DashboardSkeleton`) que reusam sub-skeletons (`StatCardSkeleton`, `PendingCardSkeleton`).

6. **Skeleton inline para rotas publicas** -- em rotas publicas, prefira Skeletons inline simples (`div` com `animate-pulse`) em vez de componentes extraidos.

7. **`animate-pulse` com `bg-accent`** -- todas as areas de loading usam estas classes base do componente `Skeleton`.

8. **Status-based rendering** -- sempre trate os tres estados: `pending` (Skeleton), `error` (LoadError), `success` (dados reais).

9. **Props configuráveis em Skeletons compostos** -- permita customizar quantidades via props (ex.: `statCards={4}`) para reuso.

10. **Nao usar Spinner em loading de pagina** -- Spinner e para botoes de acao. Loading de pagina/secao sempre usa Skeleton.

---

## Checklist

- [ ] Componente de dados tem um Skeleton pareado.
- [ ] Skeleton replica a estrutura de layout do componente real.
- [ ] Arquivo do Skeleton esta na mesma pasta do componente (ou em `components/common/` para compostos).
- [ ] Skeleton usa `Array.from({ length: N })` para items repetidos.
- [ ] Integrado com React Query via `status === 'pending'` ou `isLoading`.
- [ ] Tamanhos de Skeleton sao coerentes com o conteudo real (h-4 para texto, h-10 para inputs).
- [ ] Nenhum layout shift ao trocar de Skeleton para conteudo real.
- [ ] Estado `error` renderiza `LoadError` (nao Skeleton).

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Layout shift ao carregar | Skeleton tem layout diferente do conteudo | Replicar mesmos grids, gaps e tamanhos |
| Tela branca durante loading | Faltou Skeleton para o estado `pending` | Adicionar `{status === 'pending' && <Skeleton />}` |
| Skeleton aparece apos dados | Condicional usa `&&` com ordem errada | Verificar que `pending` vem antes de `success` |
| Muitas linhas de Skeleton | `length` muito alto | Usar valor razoavel: 10 para tabelas, 3-4 para cards |
| Skeleton sem animacao | Faltou `animate-pulse` | Verificar que usa componente `Skeleton` de `@/components/ui/skeleton` |
| Spinner usado para loading de pagina | Confundiu Spinner (botao) com Skeleton (pagina) | Trocar Spinner por Skeleton para loading de secao/pagina |

---

**Cross-references:** ver [028-skill-tabela-paginada.md](./028-skill-tabela-paginada.md), [029-skill-sheet-dialog-crud.md](./029-skill-sheet-dialog-crud.md), [022-skill-componente-ui.md](./022-skill-componente-ui.md), [038-skill-endpoint-stats.md](./038-skill-endpoint-stats.md).
