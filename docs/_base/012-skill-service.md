# Skill: Service

O pattern Service encapsula a comunicacao com servicos externos (email, storage, pagamento, etc.) seguindo o mesmo principio de inversao de dependencia usado nos repositories. Cada service e composto por um contract (abstract class) que define a interface publica, uma implementacao concreta decorada com `@Service()` que faz a integracao real, e uma implementacao in-memory usada exclusivamente em testes. Isso permite trocar de provider (ex.: Nodemailer para SendGrid) sem alterar nenhum use case ou controller -- basta mudar o binding no `di-registry.ts`.

---

## Estrutura do Arquivo

```
backend/
  application/
    services/
      {{service}}/
        {{service}}-contract.service.ts      <-- abstract class (contract)
        {{provider}}-{{service}}.service.ts   <-- implementacao concreta (@Service)
        in-memory-{{service}}.service.ts      <-- implementacao para testes
```

- Cada service vive em seu proprio diretorio dentro de `backend/application/services/`.
- O diretorio recebe o nome do dominio do service (ex.: `email`, `storage`, `payment`).
- Sempre existem no minimo 3 arquivos: contract, implementacao concreta e in-memory.

---

## Template

### Contract (abstract class)

```typescript
// backend/application/services/{{service}}/{{service}}-contract.service.ts

export interface {{Service}}Options {
  // parametros de entrada do servico
}

export interface {{Service}}Result {
  success: boolean;
  message: string;
}

export abstract class {{Service}}ContractService {
  abstract execute(options: {{Service}}Options): Promise<{{Service}}Result>;
}
```

### Implementacao concreta

```typescript
// backend/application/services/{{service}}/{{provider}}-{{service}}.service.ts

import { Service } from 'fastify-decorators';
import { {{Service}}ContractService, type {{Service}}Options, type {{Service}}Result } from './{{service}}-contract.service';

@Service()
export default class {{Provider}}{{Service}}Service extends {{Service}}ContractService {
  private client: any;

  constructor() {
    super();
    this.setupClient();
  }

  private setupClient(): void {
    // inicializa o client do provider externo
  }

  async execute(options: {{Service}}Options): Promise<{{Service}}Result> {
    // implementacao real usando o provider
  }
}
```

### Implementacao in-memory

```typescript
// backend/application/services/{{service}}/in-memory-{{service}}.service.ts

import { {{Service}}ContractService, type {{Service}}Options, type {{Service}}Result } from './{{service}}-contract.service';

interface Stored{{Service}} extends {{Service}}Options {
  timestamp: Date;
}

export default class InMemory{{Service}}Service extends {{Service}}ContractService {
  private items: Stored{{Service}}[] = [];

  async execute(options: {{Service}}Options): Promise<{{Service}}Result> {
    this.items.push({ ...options, timestamp: new Date() });
    return { success: true, message: '{{Service}} executed successfully (in-memory)' };
  }

  // Helpers para testes
  getLastItem(): Stored{{Service}} | undefined {
    return this.items.at(-1);
  }

  getAll(): Stored{{Service}}[] {
    return this.items;
  }

  clear(): void {
    this.items = [];
  }
}
```

---

## Exemplo Real

### Contract: `email-contract.service.ts`

```typescript
export interface EmailOptions {
  to: string[];
  subject: string;
  body: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  testUrl?: string | boolean;
}

export abstract class EmailContractService {
  abstract sendEmail(options: EmailOptions): Promise<EmailResult>;
  abstract buildTemplate(payload: { template: string; data: Record<string, unknown> }): Promise<string>;
}
```

### Implementacao concreta: `nodemailer-email.service.ts`

```typescript
import { Service } from 'fastify-decorators';
import nodemailer from 'nodemailer';
import { EmailContractService, type EmailOptions, type EmailResult } from './email-contract.service';

@Service()
export default class NodemailerEmailService extends EmailContractService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    super();
    this.setupTransporter();
  }

  private setupTransporter(): void {
    // configura o transporter do Nodemailer com as credenciais de SMTP
    // usa variaveis de ambiente (Env.SMTP_HOST, Env.SMTP_PORT, etc.)
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // envia email real usando this.transporter.sendMail(...)
    // retorna { success: true, message: 'Email enviado', testUrl: info.messageId }
  }

  async buildTemplate(payload: { template: string; data: Record<string, unknown> }): Promise<string> {
    // compila template HTML substituindo variaveis dinamic com payload.data
    // retorna a string HTML final
  }
}
```

### Implementacao in-memory: `in-memory-email.service.ts`

```typescript
import { EmailContractService, type EmailOptions, type EmailResult } from './email-contract.service';

interface StoredEmail extends EmailOptions {
  timestamp: Date;
  template?: string;
}

export default class InMemoryEmailService extends EmailContractService {
  private emails: StoredEmail[] = [];

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    this.emails.push({ ...options, timestamp: new Date() });
    return { success: true, message: 'Email enviado (in-memory)' };
  }

  async buildTemplate(payload: { template: string; data: Record<string, unknown> }): Promise<string> {
    return `<html><body>${payload.template}</body></html>`;
  }

  getLastEmail(): StoredEmail | undefined {
    return this.emails.at(-1);
  }

  clear(): void {
    this.emails = [];
  }
}
```

**Leitura do exemplo:**

1. `EmailContractService` e a abstract class que define o contrato publico: `sendEmail` e `buildTemplate`. Nenhum use case ou controller conhece a implementacao concreta.
2. `NodemailerEmailService` e a implementacao real, decorada com `@Service()`, que usa a biblioteca `nodemailer` para enviar emails via SMTP. O transporter e inicializado no constructor.
3. `InMemoryEmailService` armazena os emails em um array na memoria. Os helpers `getLastEmail()` e `clear()` facilitam assertions nos testes sem depender de servico externo.
4. O binding entre contract e implementacao e feito no `di-registry.ts` (ver `011-skill-di-registry.md`):
   ```typescript
   injectablesHolder.injectService(EmailContractService, NodemailerEmailService);
   ```
5. Para testes, o binding e trocado para a versao in-memory:
   ```typescript
   injectablesHolder.injectService(EmailContractService, InMemoryEmailService);
   ```

---

## Regras e Convencoes

1. **Contract e sempre uma abstract class** -- nunca use `interface` pura para o contract do service. O `fastify-decorators` precisa de uma referencia de classe em runtime para resolver a injecao de dependencia.

2. **Interfaces de entrada e saida no contract** -- as interfaces `Options` e `Result` sao exportadas junto com a abstract class no arquivo de contract. Isso garante que qualquer implementacao use os mesmos tipos.

3. **`@Service()` apenas na implementacao concreta** -- o decorator `@Service()` do `fastify-decorators` deve ser aplicado somente na classe concreta, nunca no contract.

4. **Default export na implementacao** -- tanto a implementacao concreta quanto a in-memory usam `export default class`. O contract usa named export (`export abstract class`).

5. **In-memory obrigatoria** -- toda implementacao de service deve ter uma versao in-memory correspondente para viabilizar testes unitarios e de integracao sem dependencias externas.

6. **In-memory sem `@Service()`** -- a implementacao in-memory nao recebe o decorator `@Service()` pois ela e instanciada manualmente nos testes ou registrada via DI apenas no contexto de teste.

7. **Inicializacao no constructor** -- a implementacao concreta deve inicializar seus clients e transporters no constructor (via metodo privado `setup*`). Isso garante que o service esteja pronto para uso assim que o container o resolver.

8. **Registro via DI** -- o binding contract/implementacao e feito exclusivamente no `di-registry.ts`. Nunca instancie o service manualmente em use cases ou controllers.

9. **Naming convention** -- o nome do arquivo segue o padrao `[provider]-[service].service.ts` para a implementacao concreta e `in-memory-[service].service.ts` para testes.

10. **Mesma estrutura que repository** -- o pattern de contract + implementacao concreta + in-memory e identico ao usado nos repositories (ver `009-skill-repository.md`), garantindo consistencia em toda a codebase.

---

## Checklist

- [ ] O diretorio do service esta em `backend/application/services/[nome]/`.
- [ ] Existem 3 arquivos: `[nome]-contract.service.ts`, `[provider]-[nome].service.ts` e `in-memory-[nome].service.ts`.
- [ ] O contract e uma abstract class com named export.
- [ ] As interfaces de `Options` e `Result` estao exportadas no arquivo de contract.
- [ ] A implementacao concreta usa `@Service()` e `export default class`.
- [ ] A implementacao concreta estende a abstract class do contract.
- [ ] A implementacao in-memory estende a abstract class do contract.
- [ ] A implementacao in-memory **nao** tem `@Service()`.
- [ ] A implementacao in-memory tem helpers para testes (`getLastItem`, `clear`, etc.).
- [ ] O binding foi registrado no `di-registry.ts` via `injectablesHolder.injectService(Contract, Implementacao)`.
- [ ] O use case injeta o contract (abstract class), nunca a implementacao concreta.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `Cannot resolve dependency` em runtime | O service nao foi registrado no `di-registry.ts` | Adicionar `injectablesHolder.injectService(Contract, Implementacao)` no `di-registry.ts` |
| `@Service()` no contract | Decorator aplicado na abstract class ao inves da implementacao concreta | Remover `@Service()` do contract e manter apenas na implementacao concreta |
| `@Service()` no in-memory | Decorator aplicado na versao de testes | Remover `@Service()` do in-memory -- ele e instanciado manualmente ou registrado via DI apenas em testes |
| Use case importando implementacao concreta | Quebra inversao de dependencia -- use case conhece o provider | Use case deve importar apenas o contract: `import { EmailContractService }` |
| Interface ao inves de abstract class | `fastify-decorators` nao consegue resolver interfaces TypeScript em runtime | Usar abstract class para o contract |
| In-memory inexistente | Testes dependem de servico externo real, tornando-os frageis e lentos | Criar implementacao in-memory com helpers para assertions |
| Metodo faltando na implementacao | A classe concreta nao implementa todos os metodos abstratos do contract | Implementar todos os metodos definidos na abstract class -- o TypeScript acusa erro em compile time |
| Named export na implementacao concreta | Inconsistencia com o padrao esperado pelo `di-registry.ts` | Usar `export default class` na implementacao concreta e in-memory |

---

**Cross-references:** ver [011-skill-di-registry.md](./011-skill-di-registry.md) para o registro de bindings, [009-skill-repository.md](./009-skill-repository.md) para o padrao analogo em repositories, [014-skill-kernel.md](./014-skill-kernel.md) para a inicializacao que chama `registerDependencies()`.
