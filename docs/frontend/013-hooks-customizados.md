# Hooks Customizados

Documentacao dos hooks customizados do frontend LowCodeJS que nao estao relacionados ao TanStack Query. Estes hooks fornecem funcionalidades utilitarias e de controle de permissoes utilizadas em toda a aplicacao.

---

## Visao Geral

| Hook                  | Arquivo                              | Descricao                                          |
|-----------------------|--------------------------------------|----------------------------------------------------|
| `useDebouncedValue`   | `src/hooks/use-debounced-value.tsx`  | Retorna valor com atraso (debounce)                |
| `useIsMobile`         | `src/hooks/use-mobile.ts`           | Detecta se o dispositivo e mobile                  |
| `useTablePermission`  | `src/hooks/use-table-permission.ts` | Verifica permissoes em uma tabela especifica       |
| `usePermission`       | `src/hooks/use-table-permission.ts` | Verifica permissoes gerais (sem tabela especifica) |

---

## useDebouncedValue

**Arquivo:** `src/hooks/use-debounced-value.tsx`

Hook generico que retorna uma versao "debounced" de qualquer valor. Util para evitar chamadas excessivas de API durante digitacao em campos de busca.

### Implementacao

```ts
import * as React from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return (): void => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### API

| Parametro | Tipo     | Descricao                              |
|-----------|----------|----------------------------------------|
| `value`   | `T`      | Valor original a ser debounced         |
| `delay`   | `number` | Tempo de espera em milissegundos       |
| **Retorno** | `T`    | Valor atualizado apos o delay          |

### Exemplo de Uso

```tsx
function SearchInput() {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  // A query so dispara apos 300ms sem digitacao
  const { data } = useReadTableRowPaginated({
    slug: 'minha-tabela',
    search: { search: debouncedSearch, page: 1, perPage: 20 },
  });

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Buscar registros..."
    />
  );
}
```

### Comportamento

1. O valor inicial e definido via `useState`
2. Quando `value` muda, um `setTimeout` e agendado
3. Se `value` muda novamente antes do `delay`, o timer anterior e cancelado (via cleanup do `useEffect`)
4. Apenas apos `delay` milissegundos sem mudancas, o `debouncedValue` e atualizado

---

## useIsMobile

**Arquivo:** `src/hooks/use-mobile.ts`

Hook que detecta se a viewport atual corresponde a um dispositivo mobile, utilizando a API `matchMedia` do navegador.

### Implementacao

```ts
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return (): void => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

### API

| Parametro        | Tipo      | Descricao                                   |
|------------------|-----------|---------------------------------------------|
| **Retorno**      | `boolean` | `true` se a largura e menor que 768px       |

### Constantes

| Constante           | Valor | Descricao                              |
|---------------------|-------|----------------------------------------|
| `MOBILE_BREAKPOINT` | `768` | Largura maxima em pixels para mobile   |

### Comportamento

1. Estado inicial e `undefined` (renderizado como `false` via `!!`)
2. No mount, registra um listener `matchMedia` para `(max-width: 767px)`
3. Define o valor inicial com base na largura atual da janela
4. Atualiza automaticamente quando a janela e redimensionada cruzando o breakpoint
5. Remove o listener no unmount

### Exemplo de Uso

```tsx
function ResponsiveLayout() {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileNavigation />
  ) : (
    <DesktopSidebar />
  );
}
```

**Nota:** Este hook e utilizado internamente pelo componente `SidebarProvider` para alternar entre o sidebar desktop e o sheet mobile.

---

## useTablePermission

**Arquivo:** `src/hooks/use-table-permission.ts`

Hook principal de autorizacao que verifica se o usuario atual tem permissao para executar acoes em uma tabela especifica. Combina multiplas fontes de informacao: role do usuario, propriedade da tabela, administracao da tabela, visibilidade da tabela e permissoes do grupo.

### API

```ts
export function useTablePermission(
  table: ITable | undefined,
): UseTablePermissionResult;
```

| Parametro | Tipo                  | Descricao                    |
|-----------|-----------------------|------------------------------|
| `table`   | `ITable \| undefined` | Tabela para verificar acesso |

### Retorno: `UseTablePermissionResult`

| Propriedade     | Tipo                            | Descricao                                      |
|-----------------|---------------------------------|-------------------------------------------------|
| `isOwner`       | `boolean`                       | Usuario e o dono da tabela                      |
| `isAdmin`       | `boolean`                       | Usuario e administrador da tabela               |
| `isOwnerOrAdmin`| `boolean`                       | Usuario e dono ou admin da tabela               |
| `can`           | `(action: TableAction) => boolean` | Funcao que verifica permissao para uma acao  |
| `isLoading`     | `boolean`                       | Perfil do usuario ainda esta carregando         |

### Tipo `TableAction`

```ts
export type TableAction =
  | 'VIEW_TABLE'   | 'UPDATE_TABLE'  | 'REMOVE_TABLE'  | 'CREATE_TABLE'
  | 'VIEW_FIELD'   | 'CREATE_FIELD'  | 'UPDATE_FIELD'  | 'REMOVE_FIELD'
  | 'VIEW_ROW'     | 'CREATE_ROW'    | 'UPDATE_ROW'    | 'REMOVE_ROW';
```

### Mapeamento de Permissoes

Cada `TableAction` e mapeada para um slug de permissao verificado no grupo do usuario:

| TableAction      | Slug de Permissao  |
|------------------|--------------------|
| `CREATE_TABLE`   | `create-table`     |
| `UPDATE_TABLE`   | `update-table`     |
| `REMOVE_TABLE`   | `remove-table`     |
| `VIEW_TABLE`     | `view-table`       |
| `CREATE_FIELD`   | `create-field`     |
| `UPDATE_FIELD`   | `update-field`     |
| `REMOVE_FIELD`   | `remove-field`     |
| `VIEW_FIELD`     | `view-field`       |
| `CREATE_ROW`     | `create-row`       |
| `UPDATE_ROW`     | `update-row`       |
| `REMOVE_ROW`     | `remove-row`       |
| `VIEW_ROW`       | `view-row`         |

### Logica de Decisao do `can()`

A funcao `can()` segue uma cadeia de verificacoes com retorno antecipado:

```
1. MASTER?
   Sim -> ACESSO TOTAL (retorna true para qualquer acao)

2. ADMINISTRATOR?
   Sim -> ACESSO TOTAL a todas as tabelas

3. Dono ou Admin da tabela?
   Sim -> ACESSO TOTAL a esta tabela

4. Usuario nao logado (visitante)?
   - Tabela PUBLIC + acao VIEW -> permite
   - Tabela FORM + acao CREATE_ROW -> permite
   - Caso contrario -> bloqueia

5. Acao e exclusiva de dono/admin?
   CREATE_FIELD, UPDATE_FIELD, REMOVE_FIELD,
   UPDATE_TABLE, REMOVE_TABLE, UPDATE_ROW, REMOVE_ROW
   Sim -> bloqueia (so dono/admin pode)

6. Verificar visibilidade da tabela:
   - PRIVATE -> bloqueia tudo
   - RESTRICTED -> bloqueia CREATE_ROW
   - OPEN -> permite ver e criar
   - PUBLIC -> permite ver e criar
   - FORM -> bloqueia VIEW (so permite criar via visitante)

7. Verificar permissoes do grupo do usuario
   -> Busca slug da acao nas permissoes do grupo
```

### Tabela de Visibilidade

| Visibilidade | Visitante (VIEW) | Visitante (CREATE) | Logado (VIEW) | Logado (CREATE) | Dono/Admin |
|--------------|-------------------|---------------------|----------------|------------------|------------|
| `PRIVATE`    | Nao               | Nao                 | Nao            | Nao              | Sim        |
| `RESTRICTED` | Nao               | Nao                 | Sim*           | Nao              | Sim        |
| `OPEN`       | Nao               | Nao                 | Sim*           | Sim*             | Sim        |
| `PUBLIC`     | Sim               | Nao                 | Sim*           | Sim*             | Sim        |
| `FORM`       | Nao               | Sim                 | Nao            | Nao**            | Sim        |

*Sujeito a permissoes do grupo do usuario.
**No modo FORM, usuarios logados nao podem ver; apenas visitantes podem criar.

### Exemplo de Uso

```tsx
function TableActions({ table }: { table: ITable }) {
  const { can, isOwner, isLoading } = useTablePermission(table);

  if (isLoading) return <Spinner />;

  return (
    <div>
      {can('VIEW_TABLE') && <ViewButton />}
      {can('UPDATE_TABLE') && <EditButton />}
      {can('REMOVE_TABLE') && <DeleteButton />}
      {can('CREATE_ROW') && <AddRowButton />}
      {isOwner && <TransferOwnershipButton />}
    </div>
  );
}
```

---

## usePermission

**Arquivo:** `src/hooks/use-table-permission.ts`

Hook simplificado para verificar permissoes gerais que nao dependem de uma tabela especifica (ex: permissao para criar tabelas).

### API

```ts
export function usePermission(): {
  can: (action: TableAction) => boolean;
  isLoading: boolean;
};
```

| Propriedade  | Tipo                               | Descricao                                    |
|--------------|------------------------------------|----------------------------------------------|
| `can`        | `(action: TableAction) => boolean` | Verifica permissao baseada no grupo          |
| `isLoading`  | `boolean`                          | Perfil ainda esta carregando                 |

### Logica de Decisao

```
1. MASTER? -> ACESSO TOTAL
2. ADMINISTRATOR? -> ACESSO TOTAL
3. Verifica slug da acao nas permissoes do grupo do usuario
```

### Exemplo de Uso

```tsx
function TableListPage() {
  const { can, isLoading } = usePermission();

  return (
    <div>
      <h1>Tabelas</h1>
      {can('CREATE_TABLE') && (
        <Button onClick={openCreateDialog}>
          Nova Tabela
        </Button>
      )}
    </div>
  );
}
```

---

## Dependencias Internas

Os hooks de permissao dependem de:

| Dependencia                | Descricao                                         |
|----------------------------|---------------------------------------------------|
| `useAuthenticationStore`   | Obtem `sub` (ID) do usuario autenticado            |
| `useProfileRead`           | Busca perfil completo incluindo grupo e permissoes |
| `E_ROLE`                   | Constantes de papeis (MASTER, ADMINISTRATOR, etc.) |
| `E_TABLE_VISIBILITY`       | Constantes de visibilidade da tabela               |

---

## Estrutura de Arquivos

```
src/hooks/
  use-debounced-value.tsx      # Hook de debounce generico
  use-mobile.ts                # Deteccao de dispositivo mobile
  use-table-permission.ts      # useTablePermission + usePermission
```
