# Prompt: Implementar Editor de Código JavaScript Completo + Executor Backend

## Contexto

Plataforma low-code com tabelas dinâmicas (MongoDB/Mongoose). Cada tabela tem campos configuráveis e **scripts JavaScript** que executam em 3 hooks do ciclo de vida de um registro:

- **onLoad** — ao carregar formulário (pós-query)
- **beforeSave** — antes de salvar (bloqueante — `throw new Error()` cancela o save)
- **afterSave** — após salvar (não bloqueante — erros só logam, não cancelam)

O usuário escreve esses scripts num editor Monaco no frontend. O backend recebe o código como string e executa.

## Formato Obrigatório: IIFE (Immediately Invoked Function Expression)

Todo código deve ser escrito no formato IIFE async:

```javascript
(async () => {
  // Seu código aqui
  // Pode usar await livremente
})();
```

**Por que este formato é obrigatório?**

1. **Suporte a await** - Permite usar `await` em qualquer lugar do código
2. **Escopo isolado** - Variáveis não vazam para o escopo global
3. **Comportamento consistente** - O código executa da mesma forma no editor e no backend
4. **Validação clara** - O editor valida se o código está no formato correto antes de salvar

**O backend NÃO faz wrap automático** - o usuário é responsável por escrever o código neste formato.

## Stack

- **Backend:** Node.js 22 + Fastify + TypeScript + Mongoose (MongoDB)
- **Frontend:** React + Vite + TypeScript + Monaco Editor (`@monaco-editor/react`)
- **Infra:** Docker + VPS

---

## PARTE 1: BACKEND — Executor de Código

### Tecnologia: `node:vm` nativo (Node 22)

Usar `vm.createContext()` + `vm.runInNewContext()`. SEM dependências externas.

**Justificativa:** os scripts são escritos por usuários internos da plataforma (não código público malicioso), preciso de async/await nativo, e não quero dependência externa.

### Requisitos do executor

1. **Async/await nativo** — o código do usuário DEVE escrever em formato IIFE: `(async () => { ... })()`
2. **Timeout** de 5 segundos (configurável)
3. **Captura de console.log** — interceptar todos os `console.log/warn/error` e retornar como array de strings
4. **Código executa como está** — SEM normalização, SEM adicionar ponto e vírgula, SEM tentar "consertar" sintaxe
5. **Deletar o arquivo `normalize-code.core.ts`** — ele não deve existir no projeto final
6. **Deletar dependência do `vm2`** — remover do package.json

### Tratamento de erros

Retornar erros amigáveis e categorizados:

```typescript
type ExecutionError = {
  type: "syntax" | "runtime" | "timeout" | "unknown";
  message: string; // mensagem limpa pro usuário
  line?: number; // linha do erro (quando disponível)
  column?: number; // coluna do erro (quando disponível)
};
```

- **Erro de sintaxe:** parsear a mensagem do SyntaxError pra extrair linha/coluna
- **Erro de runtime:** stack trace limpo (sem internals do node:vm)
- **Timeout:** "Script excedeu o tempo limite de execução (5s)"
- **Qualquer outro:** "Erro desconhecido na execução"

### API do sandbox — O que o código do usuário tem acesso

#### A) Objetos JavaScript nativos

```
console (interceptado), JSON, Date, Math, parseInt, parseFloat, isNaN, isFinite,
Number, String, Boolean, Array, Object, RegExp, Map, Set,
Promise, Error, TypeError, RangeError, SyntaxError,
encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
setTimeout (com limite de 5s), clearTimeout, setInterval (com limite), clearInterval
```

**BLOQUEAR:** `require`, `import`, `process`, `global`, `globalThis`, `__dirname`, `__filename`, `Buffer`, `fetch`, qualquer módulo Node.

#### B) Objeto `field` — Manipulação de campos

```typescript
field.get(slug: string): any
// Retorna o valor do campo pelo slug SIMPLES (sem prefixo da tabela)
// Resolve automaticamente hífens/underscores
// Ex: field.get('nome'), field.get('data-nascimento'), field.get('data_nascimento')

field.set(slug: string, value: any): void
// Define o valor do campo no documento
// Faz conversão inteligente de tipos:
//   - String numérica → Number ("123" → 123, "12.5" → 12.5)
//   - "true"/"false" → Boolean
//   - String ISO date → Date
// Atualiza o documento mongoose diretamente

field.getAll(): Record
// Retorna todos os campos como objeto { slug: valor }
// Slugs normalizados (sem hífens)
```

#### C) Objeto `context` — Informações do contexto

```typescript
context.action: 'novo_registro' | 'editar_registro' | 'excluir_registro' | 'carregamento_formulario'
context.moment: 'carregamento_formulario' | 'antes_salvar' | 'depois_salvar'
context.userId: string
context.isNew: boolean  // atalho: context.action === 'novo_registro'
context.table: {
  _id: string,           // ID da tabela
  name: string,          // Nome da tabela
  slug: string           // Slug da tabela
}
```

#### D) Objeto `email` — Envio de emails (ASYNC)

```typescript
await email.send(to: string[], subject: string, body: string): Promise

await email.sendTemplate(to: string[], subject: string, message: string, data?: Record): Promise
```

**IMPORTANTE:** Como essas funções são async e vivem no host (Node.js), elas precisam ser expostas ao sandbox via callbacks que retornam Promises. O código do usuário DEVE ser escrito no formato IIFE:

```javascript
// Formato obrigatório - o usuário deve escrever assim:
(async () => {
  // código aqui
  // pode usar await livremente
})();
```

**Nota:** O backend NÃO faz wrap automático. O usuário é responsável por escrever o código no formato IIFE.

#### E) Objeto `utils` — Utilitários

```typescript
utils.today(): Date           // new Date() com horário zerado (00:00:00.000)
utils.now(): Date             // new Date() com horário atual
utils.formatDate(date: Date | string, format?: string): string  // Formatação simples
utils.sha256(text: string): string    // Hash SHA-256 hex (usa crypto nativo do Node)
utils.uuid(): string          // UUID v4 (usa crypto.randomUUID() do Node)
```

### Estrutura de arquivos do backend

```
src/application/core/table/
├── executor.ts          # Função que executa código com node:vm
│                        # - Recebe: código string + sandbox object
│                        # - Executa código como está (formato IIFE obrigatório)
│                        # - Aplica timeout
│                        # - Captura console.logs
│                        # - Retorna: { success, error?, logs }
│
├── sandbox.ts           # Função que monta o objeto sandbox
│                        # - Recebe: doc mongoose, table slug, fields, context
│                        # - Cria objetos: field, context, email, utils
│                        # - Injeta variáveis diretas dos campos
│                        # - Injeta JS builtins permitidos
│                        # - Retorna: sandbox object pronto
│
├── field-resolver.ts    # Funções auxiliares para resolver slugs
│                        # - normalizeSlug: 'data-nascimento' → 'data_nascimento'
│                        # - resolveFieldValue: busca valor no doc por slug (tenta ambas formas)
│                        # - convertValue: converte valores para tipos apropriados
│
├── handler.ts           # Nova função principal (substitui HandlerFunction)
│                        # - Orquestra: sandbox.ts → executor.ts → field-resolver.ts
│                        # - Interface async
│                        # - Chamada pelos middlewares Mongoose
│
└── types.ts             # Interfaces e tipos compartilhados
```

**DELETAR:**

- `normalize-code.core.ts`
- Qualquer import/referência ao `vm2`

### Interface do handler (o que os middlewares Mongoose chamam)

```typescript
export async function executeScript(params: {
  code: string;
  doc: Record;
  tableSlug: string;
  fields: Array; // com tipo pra gerar types melhores
  context: {
    userAction:
      | "novo_registro"
      | "editar_registro"
      | "excluir_registro"
      | "carregamento_formulario";
    executionMoment:
      | "carregamento_formulario"
      | "antes_salvar"
      | "depois_salvar";
    userId?: string;
  };
}): Promise;
```

### Ajuste nos middlewares Mongoose (build-table.core.ts)

Os middlewares `schema.pre('save')` e `schema.post('save')` precisam chamar `await executeScript(...)` no lugar do `HandlerFunction(...)` síncrono.

---

## PARTE 2: FRONTEND — Editor Monaco com Autocomplete

### Componente principal: `CodeEditor`

```typescript
// Props do componente
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string; // default: 'javascript'
  height?: string; // default: '300px'
  table?: {
    slug: string;
    fields: Array;
  };
  hook: "onLoad" | "beforeSave" | "afterSave"; // pra contextualizar o tutorial
  readOnly?: boolean;
}
```

### Configuração do Monaco

```typescript
// Opções do editor
{
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  theme: 'vs-dark',
  language: 'javascript',
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: { enabled: true },
}
```

### IntelliSense / Autocomplete — Types dinâmicos

Usar `monaco.languages.typescript.javascriptDefaults.addExtraLib()` para injetar definições TypeScript no editor.

**Hook `useMonacoTypes`** que gera as definições baseadas nos campos da tabela:

#### Types estáticos (sempre presentes)

```typescript
// Estes types são fixos e sempre injetados no Monaco

interface FieldApi {
  /** Obtém o valor de um campo pelo slug */
  get(slug: string): any;
  /** Define o valor de um campo */
  set(slug: string, value: any): void;
  /** Retorna todos os campos como objeto */
  getAll(): Record;
}

interface ContextApi {
  /** Ação do usuário: 'novo_registro' | 'editar_registro' | 'excluir_registro' | 'carregamento_formulario' */
  readonly action:
    | "novo_registro"
    | "editar_registro"
    | "excluir_registro"
    | "carregamento_formulario";
  /** Momento da execução: 'carregamento_formulario' | 'antes_salvar' | 'depois_salvar' */
  readonly moment: "carregamento_formulario" | "antes_salvar" | "depois_salvar";
  /** ID do usuário logado */
  readonly userId: string;
  /** Se é um registro novo */
  readonly isNew: boolean;
}

interface EmailResult {
  success: boolean;
  message: string;
}

interface EmailApi {
  /** Envia email simples */
  send(to: string[], subject: string, body: string): Promise;
  /** Envia email com template */
  sendTemplate(
    to: string[],
    subject: string,
    message: string,
    data?: Record,
  ): Promise;
}

interface UtilsApi {
  /** Retorna a data atual sem horário (00:00:00) */
  today(): Date;
  /** Retorna a data e hora atual */
  now(): Date;
  /** Formata uma data */
  formatDate(date: Date | string, format?: string): string;
  /** Gera hash SHA-256 */
  sha256(text: string): string;
  /** Gera UUID v4 */
  uuid(): string;
}

declare const field: FieldApi;
declare const context: ContextApi;
declare const email: EmailApi;
declare const utils: UtilsApi;
```

#### Types dinâmicos (gerados por tabela)

Baseados nos campos da tabela, gerar overloads tipados:

```typescript
// Exemplo para tabela "kanban" com campos: título (text), descrição (text), porcentagem_concluída (number)

// Overloads tipados do field.get
declare function _fieldGet(slug: "titulo"): string;
declare function _fieldGet(slug: "descricao"): string;
declare function _fieldGet(slug: "porcentagem-concluida"): number;
declare function _fieldGet(slug: string): any;

// Overloads tipados do field.set
declare function _fieldSet(slug: "titulo", value: string): void;
declare function _fieldSet(slug: "descricao", value: string): void;
declare function _fieldSet(slug: "porcentagem-concluida", value: number): void;
declare function _fieldSet(slug: string, value: any): void;
```

**Mapeamento de tipos de campo para TypeScript:**

| Tipo do campo (E_FIELD_TYPE) | Tipo TypeScript       |
| ---------------------------- | --------------------- |
| TEXT_SHORT                   | string                |
| TEXT_LONG                    | string                |
| DROPDOWN                     | string[]              |
| FILE                         | string                |
| DATE                         | string \| Date        |
| RELATIONSHIP                 | string                |
| FIELD_GROUP                  | Record<string, any>[] |
| EVALUATION                   | any                   |
| REACTION                     | any                   |
| CATEGORY                     | string[]              |
| USER                         | string                |

### Tutorial/Ajuda contextualizado

Cada tab (onLoad, beforeSave, afterSave) deve ter um painel de ajuda lateral ou colapsável com a documentação das funções disponíveis. O conteúdo muda conforme o hook:

#### Estrutura do tutorial

```
📖 Tutorial - {Nome do Hook}

🔹 Objetos Disponíveis:

  field - Manipulação de campos
  ├── field.get('slug')      → Obtém valor do campo
  ├── field.set('slug', val) → Define valor do campo
  └── field.getAll()         → Todos os campos como objeto

  context - Informações do contexto
  ├── context.action   → 'novo_registro' | 'editar_registro' | ...
  ├── context.moment   → 'antes_salvar' | 'depois_salvar' | ...
  ├── context.userId   → ID do usuário logado
  ├── context.isNew    → true se registro novo
  └── context.table    → { _id, name, slug }

  email - Envio de emails (usar com await)
  ├── await email.send([...], 'Assunto', 'Corpo')
  └── await email.sendTemplate([...], 'Assunto', 'Msg', { dados })

  utils - Utilitários
  ├── utils.today()         → Data sem horário
  ├── utils.now()           → Data com horário
  ├── utils.formatDate(d)   → Formata data
  ├── utils.sha256('texto') → Hash SHA-256
  └── utils.uuid()          → UUID v4

🔹 Campos desta tabela:
  field.get('titulo')
  field.get('descricao')
  field.get('data-vencimento')
  ...

🔹 Exemplo ({hook}):
  // código de exemplo contextualizado para o hook
```

**Exemplos contextualizados por hook:**

**onLoad:**

```javascript
(async () => {
  // Pré-preencher campo com data atual ao abrir formulário
  if (context.isNew) {
    field.set("data-criacao", utils.now());
    field.set("status", "rascunho");
  }
})();
```

**beforeSave:**

```javascript
(async () => {
  // Validar campos obrigatórios
  const titulo = field.get("titulo");
  if (!titulo || titulo.trim() === "") {
    throw new Error("O título é obrigatório");
  }

  // Calcular campo automático
  const preco = field.get("preco");
  const qtd = field.get("quantidade");
  field.set("total", preco * qtd);
})();
```

**afterSave:**

```javascript
(async () => {
  // Enviar notificação por email após salvar
  const responsavel = field.get("email-responsavel");
  const titulo = field.get("titulo");

  await email.send(
    [responsavel],
    "Registro atualizado",
    `O registro "${titulo}" foi atualizado com sucesso.`,
  );
})();
```

---

## PARTE 3: INTEGRAÇÃO

### Fluxo completo

```
1. Usuário abre editor Monaco no frontend
2. Monaco carrega com types dinâmicos (autocomplete dos campos + API)
3. Usuário escreve código JS
4. Código é salvo como string no campo `table.methods.beforeSave.code` (ou onLoad/afterSave)
5. Quando um registro é criado/editado, o middleware Mongoose dispara
6. Backend chama executeScript() com o código + documento + contexto
7. Código executa em sandbox node:vm com timeout
8. Resultado: success/error + logs capturados
9. Se beforeSave falhou → save é cancelado, erro retorna pro frontend
10. Se afterSave falhou → só loga, não impacta o usuário
```

### Resposta de erro para o frontend (Fastify)

Quando `beforeSave` falha, a API deve retornar um erro estruturado:

```json
{
  "statusCode": 422,
  "error": "Validation Error",
  "message": "O título é obrigatório",
  "details": {
    "hook": "beforeSave",
    "type": "runtime",
    "line": 3,
    "logs": ["Iniciando validação...", "Campo título está vazio"]
  }
}
```

---

## Exemplos de código que o usuário deve conseguir escrever e executar

### 1. Validação simples (beforeSave)

```javascript
(async () => {
  const cpf = field.get("cpf");
  if (!cpf || cpf.length !== 11) {
    throw new Error("CPF deve ter 11 dígitos");
  }
})();
```

### 2. Campo calculado (beforeSave)

```javascript
(async () => {
  const preco = field.get("preco");
  const quantidade = field.get("quantidade");
  field.set("total", preco * quantidade);
})();
```

### 3. Email após cadastro (afterSave)

```javascript
(async () => {
  const nome = field.get("nome");
  const destinatario = field.get("email");

  await email.send(
    [destinatario],
    "Bem-vindo!",
    `Olá ${nome}, seu cadastro foi realizado com sucesso!`,
  );
})();
```

### 4. Lógica com datas (beforeSave)

```javascript
(async () => {
  const nascimento = new Date(field.get("data-nascimento"));
  const hoje = utils.today();
  const idade = hoje.getFullYear() - nascimento.getFullYear();

  if (idade < 18) {
    throw new Error("Cadastro apenas para maiores de 18 anos");
  }

  field.set("idade", idade);
  field.set("categoria", idade >= 60 ? "senior" : "adulto");
})();
```

### 5. Hash e UUID (beforeSave)

```javascript
(async () => {
  const senha = field.get("senha");
  field.set("senha_hash", utils.sha256(senha));
  field.set("token", utils.uuid());
})();
```

### 6. Debug com console.log

```javascript
(async () => {
  console.log("Validando registro...");
  const campos = field.getAll();
  console.log("Total de campos:", Object.keys(campos).length);

  for (const [key, value] of Object.entries(campos)) {
    if (!value) console.warn(`Campo ${key} está vazio`);
  }
})();
```

### 7. Condicional por ação do usuário (onLoad)

```javascript
(async () => {
  if (context.isNew) {
    field.set("status", "rascunho");
    field.set("data-criacao", utils.now());
  } else {
    console.log("Editando registro existente");
  }
})();
```

### 8. Email com template (afterSave)

```javascript
(async () => {
  const emails = ["admin@empresa.com", "gerente@empresa.com"];
  const nome = field.get("nome-cliente");
  const valor = field.get("valor-total");

  await email.sendTemplate(
    emails,
    "Nova venda registrada",
    `Cliente ${nome} realizou uma compra de R$ ${valor}`,
    { cliente: nome, valor: valor, data: utils.now() },
  );
})();
```

### 9. Loops e lógica complexa (beforeSave)

```javascript
(async () => {
  const itens = field.get("itens"); // array
  let total = 0;

  if (Array.isArray(itens)) {
    for (const item of itens) {
      total += (item.preco || 0) * (item.quantidade || 1);
    }
  }

  field.set("valor-total", total);
  field.set("qtd-itens", itens ? itens.length : 0);
  console.log(`Calculado: ${itens?.length || 0} itens, total R$ ${total}`);
})();
```

### 10. Acessar informações da tabela

```javascript
(async () => {
  // Gerar código com prefixo do slug da tabela
  const prefixo = context.table.slug.toUpperCase();
  const codigo = prefixo + '-' + utils.uuid().substring(0, 8);
  field.set('codigo', codigo);

  // Log com nome da tabela
  console.log('Registro salvo na tabela:', context.table.name);
})();
```

---

## O que NÃO fazer

- ❌ **NÃO** usar `vm2` (descontinuada, vulnerabilidades)
- ❌ **NÃO** usar `eval()` ou `new Function()` sem contexto isolado
- ❌ **NÃO** criar normalização de código (o código executa como o usuário escreveu)
- ❌ **NÃO** usar Docker para execução de código
- ❌ **NÃO** expor `require`, `import`, `process`, `fs`, `child_process`, `Buffer`, `fetch`, `global`, `globalThis`
- ❌ **NÃO** permitir loops infinitos (timeout resolve)
- ❌ **NÃO** usar CryptoJS ou libs externas no sandbox (usar `node:crypto` no host)
- ❌ **NÃO** forçar o usuário a escrever `getFieldValue('$tabela_campo')` — a nova API é `field.get('campo')`

## Estrutura final de arquivos

### Backend

```
src/application/core/table/
├── executor.ts
├── sandbox.ts
├── field-resolver.ts
├── handler.ts
├── types.ts
├── method.core.ts           ← REFATORAR (importar do handler.ts, manter export pra retrocompatibilidade se necessário)
└── normalize-code.core.ts   ← ❌ DELETAR
```

### Frontend

```
src/components/code-editor/
├── code-editor.tsx           # Componente Monaco principal
├── code-editor-info-modal.tsx # Modal com documentação e campos disponíveis
├── use-monaco-types.ts       # Hook: gera e injeta types dinâmicos no Monaco
├── sandbox-types.ts          # Types estáticos (field, context, email, utils)
├── tutorial-content.ts       # Conteúdo do tutorial por hook (onLoad, beforeSave, afterSave)
└── field-type-mapper.ts      # Mapeia E_FIELD_TYPE → tipo TypeScript + gera overloads
```
