# SBES Diagramas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exportar os 4 diagramas Mermaid do artigo SBES como PNG e commitar tudo.

**Architecture:** Cada diagrama vive em um arquivo `.mmd` próprio em `docs/sbes/figures/`. O `npx @mermaid-js/mermaid-cli` exporta cada um para PNG no mesmo diretório. As referências `**Figura X**` já estão em `sbes.md`.

**Tech Stack:** Node.js 24, `@mermaid-js/mermaid-cli` v11 (via npx), Mermaid 11.

---

## Arquivos

| Ação | Caminho |
|------|---------|
| Criar | `docs/sbes/figures/fig1-stack.mmd` |
| Criar | `docs/sbes/figures/fig2-camadas.mmd` |
| Criar | `docs/sbes/figures/fig3-padroes.mmd` |
| Criar | `docs/sbes/figures/fig4-embedded.mmd` |
| Gerar | `docs/sbes/figures/fig1-stack.png` |
| Gerar | `docs/sbes/figures/fig2-camadas.png` |
| Gerar | `docs/sbes/figures/fig3-padroes.png` |
| Gerar | `docs/sbes/figures/fig4-embedded.png` |
| Já existe | `docs/superpowers/specs/2026-05-17-sbes-diagramas-design.md` |
| Já existe | `sbes.md` (referências Figura 1–4 já inseridas) |

---

## Task 1: Criar diretório e arquivos `.mmd`

**Files:**
- Create: `docs/sbes/figures/fig1-stack.mmd`
- Create: `docs/sbes/figures/fig2-camadas.mmd`
- Create: `docs/sbes/figures/fig3-padroes.mmd`
- Create: `docs/sbes/figures/fig4-embedded.mmd`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p docs/sbes/figures
```

- [ ] **Step 2: Criar `fig1-stack.mmd`**

Conteúdo exato de `docs/sbes/figures/fig1-stack.mmd`:

```
graph LR
  subgraph FE["Frontend"]
    direction TB
    R["React 19 + SSR (TanStack Start)"]
    TS["TanStack (Router · Query · Form · Table)"]
    UI["Radix UI + Tailwind CSS 4"]
    ZU["Zustand"]
  end

  subgraph BE["Backend"]
    direction TB
    FW["Fastify 5"]
    ZD["Zod · fastify-decorators"]
    TP["Node.js 22 + TypeScript"]
  end

  subgraph DB["Persistência"]
    direction TB
    MG["MongoDB · Mongoose"]
    RD["Redis"]
  end

  subgraph INF["Infraestrutura"]
    direction TB
    BQ["BullMQ"]
    FLY["Flydrive (local · S3)"]
    NM["Nodemailer"]
  end

  FE -->|REST / WebSocket| BE
  BE --> DB
  BE --> INF
```

- [ ] **Step 3: Criar `fig2-camadas.mmd`**

Conteúdo exato de `docs/sbes/figures/fig2-camadas.mmd`:

```
graph TB
  subgraph APRES["Apresentação"]
    A1["Componentes React + SSR"]
    A2["Roteamento (TanStack Router)"]
    A3["Formulários dinâmicos"]
  end

  subgraph APLIC["Aplicação"]
    AP1["Controladores Fastify"]
    AP2["Validação Zod"]
  end

  subgraph DOM["Domínio"]
    D1["Casos de Uso"]
    D2["Either&lt;HTTPException, T&gt;"]
    D3["Interfaces de Repositório"]
  end

  subgraph INFRA["Infraestrutura"]
    I1["Mongoose (MongoDB)"]
    I2["BullMQ + Redis"]
    I3["Nodemailer · Flydrive"]
  end

  APRES -->|depende de| APLIC
  APLIC -->|depende de| DOM
  INFRA -.->|implementa contratos de| DOM
```

- [ ] **Step 4: Criar `fig3-padroes.mmd`**

Conteúdo exato de `docs/sbes/figures/fig3-padroes.mmd`:

```
sequenceDiagram
  participant Br as Browser
  participant Ctrl as Controlador Fastify
  participant UC as Caso de Uso
  participant Repo as IRepositório
  participant DB as MongoDB

  Br->>Ctrl: HTTP Request
  Ctrl->>Ctrl: Zod.parse(body)
  Ctrl->>UC: execute(params)
  UC->>Repo: findById(id)
  Repo->>DB: query
  DB-->>Repo: documento
  Repo-->>UC: Right(entity)
  UC-->>Ctrl: Right(result)
  Ctrl-->>Br: HTTP 200

  note over UC,Repo: DI container resolve IRepositório → MongooseRepositório
  note over Repo,Ctrl: Either&lt;HTTPException, T&gt; — pontos de falha explícitos no contrato
```

- [ ] **Step 5: Criar `fig4-embedded.mmd`**

Conteúdo exato de `docs/sbes/figures/fig4-embedded.mmd`:

```
graph TB
  subgraph EMB["Embedded — lowcode.js (1 leitura)"]
    direction TB
    R1["Registro"]
    SC["_schema (Mixed)"]
    E1["enderecos: [ {...}, {...} ]"]
    F1["financiamentos: [ {...} ]"]
    R1 --> SC
    SC --> E1
    SC --> F1
  end

  subgraph REF["Referenciado (N leituras)"]
    direction TB
    R2["Registro"]
    E2["Endereco\n└ registro_id"]
    F2["Financiamento\n└ registro_id"]
    R2 -.->|JOIN| E2
    R2 -.->|JOIN| F2
  end
```

- [ ] **Step 6: Verificar arquivos criados**

```bash
ls docs/sbes/figures/
```

Esperado:
```
fig1-stack.mmd  fig2-camadas.mmd  fig3-padroes.mmd  fig4-embedded.mmd
```

---

## Task 2: Exportar diagramas para PNG

**Files:**
- Gerar: `docs/sbes/figures/fig1-stack.png`
- Gerar: `docs/sbes/figures/fig2-camadas.png`
- Gerar: `docs/sbes/figures/fig3-padroes.png`
- Gerar: `docs/sbes/figures/fig4-embedded.png`

- [ ] **Step 1: Exportar Figura 1 (Stack)**

```bash
npx @mermaid-js/mermaid-cli -i docs/sbes/figures/fig1-stack.mmd -o docs/sbes/figures/fig1-stack.png -w 1400
```

Esperado: arquivo `fig1-stack.png` criado (sem erros no stdout).

- [ ] **Step 2: Verificar Figura 1**

```bash
file docs/sbes/figures/fig1-stack.png
```

Esperado: `PNG image data, ...`

- [ ] **Step 3: Exportar Figura 2 (Camadas)**

```bash
npx @mermaid-js/mermaid-cli -i docs/sbes/figures/fig2-camadas.mmd -o docs/sbes/figures/fig2-camadas.png -w 900
```

- [ ] **Step 4: Exportar Figura 3 (Padrões)**

```bash
npx @mermaid-js/mermaid-cli -i docs/sbes/figures/fig3-padroes.mmd -o docs/sbes/figures/fig3-padroes.png -w 1200
```

- [ ] **Step 5: Exportar Figura 4 (Embedded)**

```bash
npx @mermaid-js/mermaid-cli -i docs/sbes/figures/fig4-embedded.mmd -o docs/sbes/figures/fig4-embedded.png -w 1000
```

- [ ] **Step 6: Confirmar todos os PNGs gerados**

```bash
ls -lh docs/sbes/figures/*.png
```

Esperado: 4 arquivos `.png`, cada um > 10KB.

Se algum tiver 0 bytes ou não existir, inspecionar o stderr do comando anterior — geralmente indica erro de sintaxe no `.mmd`. Consultar `docs/superpowers/specs/2026-05-17-sbes-diagramas-design.md` para o código correto.

---

## Task 3: Commit

- [ ] **Step 1: Verificar status**

```bash
git status
```

Esperado: arquivos novos em `docs/sbes/figures/` e `docs/superpowers/specs/2026-05-17-sbes-diagramas-design.md` e mudanças em `sbes.md`.

- [ ] **Step 2: Commitar**

```bash
git add docs/sbes/figures/ docs/superpowers/specs/2026-05-17-sbes-diagramas-design.md sbes.md
git commit -m "docs: add architecture diagrams for SBES paper (Figures 1-4)"
```

---

## Verificação Final

- [ ] 4 arquivos `.mmd` em `docs/sbes/figures/`
- [ ] 4 arquivos `.png` em `docs/sbes/figures/`, todos > 10KB
- [ ] `sbes.md` contém `**Figura 1**`, `**Figura 2**`, `**Figura 3**`, `**Figura 4**`
- [ ] Commit criado com todos os arquivos

## Troubleshooting

**Erro `puppeteer` ou `chromium` não encontrado:**
```bash
npx @mermaid-js/mermaid-cli -i ... --puppeteerConfigFile /dev/null ...
```
Ou instalar chromium: `npx puppeteer browsers install chrome`

**PNG com renderização incorreta (nó cortado, layout quebrado):**
Aumentar `-w` (largura) para `1600` ou `2000`. Ou exportar como SVG trocando `.png` por `.svg` na flag `-o`.
