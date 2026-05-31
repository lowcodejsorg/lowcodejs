# License Update — Design Spec

**Data:** 2026-05-25  
**Autor:** Jhollyfer Rodrigues  
**Status:** Aprovado

---

## Contexto

O projeto LowCodeJS já possui um arquivo `LICENSE` com MIT na raiz, mas há inconsistências entre os pacotes do monorepo:

- `backend/package.json` declara `"license": "ISC"` — conflita com MIT
- `frontend/package.json` não tem campo `license`
- `package.json` raiz não tem campo `license` nem `name`
- `README.md` não menciona licença em nenhum lugar

O objetivo é alinhar todas as declarações com a licença MIT e atualizar o README com a seção correspondente.

---

## Decisões

| Ponto | Decisão |
|---|---|
| Tipo de licença | MIT (open-source livre) |
| Titular do copyright | `Lowcodejs.org Contributors` |
| Range de anos | `2024-2026` (projeto iniciado em 2024) |
| Abordagem | Mínima — sem arquivo NOTICE |

---

## Mudanças

### 1. `LICENSE`

Alterar linha de copyright:

```
Copyright (c) 2024-2026 Lowcodejs.org Contributors
```

### 2. `backend/package.json`

```diff
- "license": "ISC",
+ "license": "MIT",
```

### 3. `frontend/package.json`

Adicionar campo após `"private": true`:

```diff
  "private": true,
+ "license": "MIT",
```

### 4. `package.json` (raiz)

Adicionar campos no topo do objeto:

```diff
+  "name": "lowcodejs",
+  "license": "MIT",
   "devDependencies": {
```

### 5. `README.md`

Adicionar seção no final do arquivo:

```markdown
## Licença

Distribuído sob a licença [MIT](LICENSE).  
Copyright © 2024-2026 [Lowcodejs.org Contributors](https://lowcodejs.org).
```

---

## Verificação

1. `cat LICENSE` — copyright mostra `2024-2026 Lowcodejs.org Contributors`
2. `cat backend/package.json | grep license` → `"license": "MIT"`
3. `cat frontend/package.json | grep license` → `"license": "MIT"`
4. `cat package.json | grep license` → `"license": "MIT"`
5. Tail do `README.md` mostra seção `## Licença` com link correto para `LICENSE`
