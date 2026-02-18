# Skill: Sheet/Dialog CRUD

Sheet e Dialog sao os componentes de interacao principal para operacoes CRUD no admin. Sheet e usado para Create (formulario dentro de sheet lateral) e View (lazy query com `enabled: open`). Dialog e usado para Delete e Approve (confirmacao + cache update otimista). Cada componente segue o padrao de trigger oculto com ref programatico, onde o `DropdownMenu` da tabela aciona o Sheet/Dialog via `ref.current?.click()`. Apos mutacoes, o cache e atualizado otimistamente via `queryClient.setQueryData` ou invalidado via `queryClient.invalidateQueries`.

---

## Estrutura do Arquivo

```
frontend/
  src/
    routes/
      _private/
        [role]/
          [entity]/
            -components/
              sheet-view-[entity]/
                index.tsx                         <-- Sheet View com lazy query
                sheet-view-[entity]-skeleton.tsx   <-- Skeleton de loading
              sheet-create-[entity]/
                sheet-create-[entity].tsx          <-- Sheet wrapper com trigger visivel
                form-create-[entity].tsx           <-- Formulario de criacao
              sheet-update-[entity]/
                sheet-update-[entity].tsx          <-- Sheet wrapper com lazy query
                form-update-[entity].tsx           <-- Formulario de edicao
              dialog-delete-[entity].tsx           <-- Dialog de confirmacao de exclusao
              dialog-approve-[entity].tsx          <-- Dialog de aprovacao/rejeicao
              table-[entities].tsx                 <-- Tabela com refs e DropdownMenu
    components/
      ui/
        sheet.tsx                                  <-- Sheet (Radix Dialog)
        dialog.tsx                                 <-- Dialog (Radix Dialog)
```

---

## Template: Sheet View (Lazy Query)

```typescript
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoadError } from '@/components/common/load-error';
import { API } from '@/lib/api';
import type { I{{Entity}} } from '@/lib/entities';
import { SheetView{{Entity}}Skeleton } from './sheet-view-{{entity}}-skeleton';

interface Props {
  {{entity}}Id: string;
}

export const SheetView{{Entity}} = React.forwardRef<HTMLButtonElement, Props>(
  ({ {{entity}}Id }, ref) => {
    const [open, setOpen] = React.useState(false);

    const query = useQuery({
      queryKey: ['/{{entities}}/'.concat({{entity}}Id), {{entity}}Id],
      queryFn: async () => {
        const route = '/{{entities}}/'.concat({{entity}}Id);
        const response = await API.get<I{{Entity}}>(route);
        return response.data;
      },
      enabled: open,
    });

    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="hidden" aria-hidden="true" ref={ref} />

        <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="px-0">
            <SheetTitle>Informacoes do {{Entity}}</SheetTitle>
          </SheetHeader>

          {query.status === 'pending' && <SheetView{{Entity}}Skeleton />}
          {query.status === 'error' && <LoadError queryKey={['/{{entities}}']} />}
          {query.status === 'success' && (
            <div className="grid gap-4 py-4">
              {/* Campos de exibicao (read-only) */}
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  },
);
```

## Template: Sheet Create

```typescript
import React from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FormCreate{{Entity}} } from './form-create-{{entity}}';

export function SheetCreate{{Entity}}(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">
          <PlusIcon className="size-4" />
          <span>Novo {{entity}}</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle>Adicionar novo {{entity}}</SheetTitle>
          <SheetDescription>Adicione um novo {{entity}} ao sistema</SheetDescription>
        </SheetHeader>

        <FormCreate{{Entity}} onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
```

## Template: Form Create (com Mutation)

```typescript
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { useSearch } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

import * as TanstackQuery from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import type { I{{Entity}}, Paginated } from '@/lib/entities';
import { MetaDefault } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export function FormCreate{{Entity}}({ onClose }: Props): React.JSX.Element {
  const { queryClient } = TanstackQuery.getContext();
  const search = useSearch({ from: '/_private/{{role}}/{{entities}}/' });

  const mutation = useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const response = await API.post<I{{Entity}}>('/{{entities}}', payload);
      return response.data;
    },
    onSuccess(data) {
      queryClient.setQueryData<Paginated<I{{Entity}}>>(
        ['/{{entities}}', search],
        (old) => {
          if (!old) return { meta: MetaDefault, data: [data] };
          return {
            meta: { ...old.meta, total: old.meta.total + 1 },
            data: [...old.data, data],
          };
        },
      );

      toast('{{Entity}} criado com sucesso', {
        className: '!bg-[var(--color-success)] !text-primary-foreground',
      });
      onClose();
    },
    onError(error: AxiosError) {
      if (error?.response?.data?.code === 409) {
        toast('Registro ja existe', {
          className: '!bg-[var(--color-error)] !text-primary-foreground',
        });
      }
    },
  });

  const form = useForm({
    defaultValues: { /* campos */ },
    validators: { onSubmit: {{Entity}}FormSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* form.Field para cada campo */}
    </form>
  );
}
```

## Template: Dialog Delete

```typescript
import { useMutation } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import * as TanstackQuery from '@/integrations/tanstack-query/root-provider';
import { API } from '@/lib/api';
import type { I{{Entity}}, Paginated } from '@/lib/entities';
import { MetaDefault } from '@/lib/utils';

interface Props {
  {{entity}}Id: string;
}

export const DialogDelete{{Entity}} = React.forwardRef<HTMLButtonElement, Props>(
  ({ {{entity}}Id }, ref) => {
    const [open, setOpen] = React.useState(false);
    const { queryClient } = TanstackQuery.getContext();
    const search = useSearch({ from: '/_private/{{role}}/{{entities}}/' });

    const mutation = useMutation({
      mutationFn: async () => {
        const response = await API.delete<I{{Entity}}>(`/{{role}}/{{entities}}/${{{entity}}Id}`);
        return response.data;
      },
      onSuccess(data) {
        setOpen(false);

        queryClient.setQueryData<Paginated<I{{Entity}}>>(
          ['/{{entities}}', search],
          (old) => {
            if (!old) return { meta: MetaDefault, data: [data] };
            return {
              meta: { ...old.meta, total: old.meta.total - 1 },
              data: old.data.filter((item) => item.id !== data.id),
            };
          },
        );

        toast('{{Entity}} excluido com sucesso.', {
          className: '!bg-[var(--color-success)] !text-primary-foreground',
          closeButton: true,
        });
      },
      onError(error: AxiosError) {
        if (error?.response?.data?.code === 404) {
          toast('{{Entity}} nao encontrado', {
            className: '!bg-[var(--color-error)] !text-primary-foreground',
          });
        }
      },
    });

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="hidden" aria-hidden="true" ref={ref} />

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {{Entity}}?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este {{entity}}? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" disabled={mutation.status === 'pending'}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => mutation.mutateAsync()}
              disabled={mutation.status === 'pending'}
            >
              {mutation.status === 'pending' && <Spinner />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
```

---

## Exemplo Real

```typescript
// routes/_private/administrator/artisans/-components/table-artisans.tsx (trecho)
function TableAdministratorArtisanRow({ artisan }: { artisan: IArtisan }): React.ReactElement {
  const deleteArtisanButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const viewArtisanButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const approveArtisanButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <TableRow key={artisan.id}>
      {/* Celulas de dados */}
      <TableCell className="w-20">
        <DropdownMenu>
          <DropdownMenuTrigger><EllipsisIcon /></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => viewArtisanButtonRef.current?.click()}>
              <EyeIcon /> Visualizar
            </DropdownMenuItem>
            {!artisan.approved && (
              <DropdownMenuItem onClick={() => approveArtisanButtonRef.current?.click()}>
                <Gavel /> Avaliar Cadastro
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => deleteArtisanButtonRef.current?.click()}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetViewArtisan artisanId={artisan.id} ref={viewArtisanButtonRef} />
        <DialogDeleteArtisan artisanId={artisan.id} ref={deleteArtisanButtonRef} />
        <DialogApproveArtisan artisan={artisan} ref={approveArtisanButtonRef} />
      </TableCell>
    </TableRow>
  );
}
```

**Leitura do exemplo:**

1. Cada acao na tabela possui um `ref` (`useRef`) que aponta para o `SheetTrigger`/`DialogTrigger` oculto.
2. O `DropdownMenuItem` chama `ref.current?.click()` para abrir o Sheet/Dialog correspondente sem renderiza-lo inline no menu.
3. Os componentes Sheet/Dialog ficam no mesmo `TableCell`, com `className="hidden"` no trigger. Isso mantem o DOM limpo e evita problemas de z-index.
4. Acoes condicionais (como "Avaliar Cadastro") sao exibidas com base no estado do item (`!artisan.approved`).
5. O padrao `React.forwardRef` nos componentes Sheet/Dialog permite que o ref do trigger seja acessivel pelo componente pai.

---

## Estrategias de Cache

### Estrategia 1: `setQueryData` (Update Otimista)

Usada para Create, Delete e Approve -- atualiza o cache imediatamente sem refetch:

```typescript
queryClient.setQueryData<Paginated<IArtisan>>(
  ['/artisans', search],  // Cache key inclui search params
  (old) => {
    if (!old) return { meta: MetaDefault, data: [data] };
    return {
      meta: { ...old.meta, total: old.meta.total + 1 },
      data: old.data.map((item) => (item.id === data.id ? data : item)),
    };
  },
);
```

### Estrategia 2: `invalidateQueries` (Refetch)

Usada para Update complexo -- invalida o cache e refaz a query:

```typescript
queryClient.invalidateQueries({
  queryKey: ['/cultural-contents'],
});
```

---

## Regras e Convencoes

1. **Trigger oculto com ref** -- Sheet/Dialog para acoes de tabela usam `SheetTrigger className="hidden"` com `React.forwardRef`. O `DropdownMenu` aciona via `ref.current?.click()`.

2. **Sheet Create com trigger visivel** -- o Sheet de criacao (acessado via botao no header) usa `SheetTrigger asChild` com `<Button>` visivel.

3. **`enabled: open` para lazy queries** -- Sheet View e Sheet Update carregam dados apenas quando abertos: `useQuery({ enabled: open })`. Isso evita chamadas desnecessarias.

4. **Status-based rendering** -- dentro do Sheet, renderize condicionalmente: `pending` → Skeleton, `error` → LoadError, `success` → conteudo real.

5. **Cache key com `search`** -- mutations que atualizam o cache devem usar `['/endpoint', search]` como key, onde `search` vem de `useSearch`. Isso garante que o cache correto (com paginacao/filtros) seja atualizado.

6. **`setQueryData` para operacoes simples** -- Create (append), Delete (filter) e Approve (map) usam update otimista. Update complexo usa `invalidateQueries`.

7. **`onClose` callback no form** -- o formulario recebe `onClose` como prop e chama apos mutacao bem-sucedida para fechar o Sheet.

8. **Tratamento de erros por codigo** -- use `error?.response?.data?.code` para tratar erros especificos (404, 409, 500) com toasts diferenciados.

9. **Loading state no botao** -- botoes de acao mostram `<Spinner />` e ficam `disabled` quando `mutation.status === 'pending'`.

10. **Separacao Sheet wrapper / Form** -- o Sheet wrapper gerencia open/close. O formulario gerencia estado do form, validacao e mutacao. Sao arquivos separados.

---

## Checklist

- [ ] Sheet View usa `enabled: open` na query (lazy loading).
- [ ] Sheet View usa `React.forwardRef` para expor o trigger ref.
- [ ] Sheet View trata `pending`, `error` e `success` condicionalmente.
- [ ] Sheet Create tem trigger visivel (`asChild` com `Button`).
- [ ] Sheet Create passa `onClose` para o formulario.
- [ ] Dialog Delete usa `React.forwardRef` para trigger oculto.
- [ ] Dialog Delete atualiza cache via `queryClient.setQueryData`.
- [ ] Cache key das mutations inclui o objeto `search` da URL.
- [ ] Formularios usam TanStack Form com validacao Zod.
- [ ] Botoes de acao mostram `Spinner` durante mutacao.
- [ ] Toasts usam classes CSS do design system (`--color-success`, `--color-error`).
- [ ] O componente de tabela usa refs para acionar Sheet/Dialog.
- [ ] Acoes condicionais no `DropdownMenu` verificam estado do item.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Sheet abre mas nao carrega dados | Faltou `enabled: open` na query | Adicionar `enabled: open` para lazy loading |
| Cache nao atualiza apos mutacao | Cache key da mutation nao inclui `search` | Usar `['/endpoint', search]` na `setQueryData` |
| Dialog nao abre ao clicar no DropdownMenu | `ref` nao esta conectado ao trigger | Usar `React.forwardRef` no componente e `ref={buttonRef}` no `SheetTrigger`/`DialogTrigger` |
| Sheet fecha mas form mantem estado | Form nao reseta ao fechar | Usar `open` como key do form ou resetar no `onOpenChange` |
| Erro `Cannot read property 'click' of null` | Componente Sheet/Dialog nao renderizou | Verificar que o componente esta montado no DOM (dentro do `TableCell`) |
| Toast com estilo errado | Classe CSS incorreta | Usar `!bg-[var(--color-success)]` (com `!` para override) |
| Update otimista mostra dados errados | `setQueryData` nao mapeia corretamente | Verificar logica do `.map()` / `.filter()` no callback |
| Multiplos Sheets abrem ao mesmo tempo | Cada Sheet gerencia seu proprio `open` state | Isso e o comportamento correto -- cada um e independente |

---

**Cross-references:** ver [028-skill-tabela-paginada.md](./028-skill-tabela-paginada.md), [020-skill-formulario.md](./020-skill-formulario.md), [018-skill-hook-mutation.md](./018-skill-hook-mutation.md), [040-skill-skeleton-loading.md](./040-skill-skeleton-loading.md).
