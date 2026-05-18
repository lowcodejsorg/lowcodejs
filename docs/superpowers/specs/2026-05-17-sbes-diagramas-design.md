# Diagramas SBES — Design Spec

**Data:** 2026-05-17  
**Contexto:** Revisor pediu diagramas para ilustrar stack e camadas no artigo SBES.  
**Ferramenta:** Mermaid (exportar para PNG/SVG via mermaid-cli ou mermaid.live).

---

## Figura 1 — Stack de Desenvolvimento (seção 3.1)

```mermaid
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

**Caption:** Stack de desenvolvimento do lowcode.js, organizada por camada tecnológica.

---

## Figura 2 — Arquitetura em Camadas (seção 3.3)

```mermaid
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

**Caption:** Arquitetura em camadas do lowcode.js. Setas sólidas indicam dependência; seta tracejada indica implementação de interface (Regra de Dependência — camadas internas não dependem das externas).

---

## Figura 3 — Padrões de Projeto em Ação (seção 3.2)

```mermaid
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

**Caption:** Fluxo de uma requisição HTTP ilustrando os padrões Repository, Either e injeção de dependência em ação conjunta.

---

## Figura 4 — Embedded Documents vs. Referências (seção 3.4)

```mermaid
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

**Caption:** Modelo embedded (lowcode.js) recupera grupos de campos em uma única leitura; modelo referenciado exige uma leitura por coleção relacionada.

---

## Exportar para imagem

```bash
# Via mermaid-cli (instalar uma vez: npm i -g @mermaid-js/mermaid-cli)
mmdc -i docs/superpowers/specs/2026-05-17-sbes-diagramas-design.md -o fig1-stack.png
```

Ou colar cada bloco em https://mermaid.live e baixar SVG/PNG.
