# Template: MODULE

Use quando o usuário quer uma tela completa (dashboard, formulário custom,
página). Recebe URL default `/e/<pkg>/<id>` e pode ser anexado a um menu
custom (tipo `EXTENSION_MODULE`).

## 1. `backend/extensions/<pkg>/modules/<id>/manifest.json`

```json
{
  "id": "<id>",
  "type": "MODULE",
  "name": "<Nome humano>",
  "description": "<O que faz>",
  "version": "1.0.0",
  "author": "<seu nome ou time>",
  "icon": "<NomeLucideIcon>",
  "route": "/e/<pkg>/<id>",
  "permissions": {
    "view": []
  },
  "requires": {
    "lowcodejs": ">=1.0.0"
  }
}
```

`permissions.view`:
- `[]` ou ausente: visível pra qualquer auth user
- `["MASTER"]`: só MASTER vê (sidebar + endpoint `/extensions/active` filtram)
- Combine roles conforme necessário

## 2. `frontend/extensions/<pkg>/modules/<id>/index.tsx`

```tsx
import React from 'react';

import { PageHeader, PageShell } from '@/components/common/page-shell';
// ... outros componentes UI

export default function MyModule(): React.JSX.Element {
  return (
    <PageShell data-test-id="module-<id>">
      <PageShell.Header>
        <PageHeader title="<Título>" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        {/* Conteúdo da página */}
      </PageShell.Content>
    </PageShell>
  );
}
```

## 3. (Opcional) Backend custom

Se o módulo chamar API custom, crie controller no mesmo diretório.
`ExtensionActiveMiddleware` obrigatório.

## 4. CLAUDE.md do pacote

Atualize `backend/extensions/<pkg>/CLAUDE.md` adicionando linha na tabela
"Modules":

```markdown
| `<id>` | `/e/<pkg>/<id>` | <descrição> |
```

E `frontend/extensions/<pkg>/CLAUDE.md` na tabela "Entries".

## 5. Smoke test

1. Restart backend → log mostra módulo carregado
2. `/extensions` (MASTER) → ativar (se `pkg !== 'core'`)
3. Acessar `/e/<pkg>/<id>` direto na URL → renderiza
4. **Para apresentar como item de menu custom**:
   - `/menus/create` → tipo "Módulo de Extensão" → selecionar o módulo →
     salvar
   - Reload → sidebar mostra o item apontando para `/e/<pkg>/<id>`

## 6. Notas

- Módulos podem usar **todos** os hooks tanstack-query existentes — a entry
  é um componente React full-fledged
- Para receber dados via loader: o loader é da rota `/e/$package/$id`, não
  da entry. Se precisar prefetch, use `useQuery({ ... })` direto na entry
- URL custom (ex: `/home`) **não suportada** ainda. Fica em Fase 6 (splat
  route com resolução em runtime). Por enquanto, o menu sempre aponta para
  `/e/<pkg>/<id>`
