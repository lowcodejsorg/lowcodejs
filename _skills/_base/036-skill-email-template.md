# Skill: Email Template

O sistema de email usa um Strategy Pattern com Dependency Injection. O `EmailContractService` define a interface abstrata com `sendEmail` e `buildTemplate`. A implementacao de producao (`NodemailerEmailService`) usa Nodemailer + EJS para renderizar templates HTML. A implementacao de testes (`InMemoryEmailService`) armazena emails em memoria para assertions. Use cases injetam o contract e nunca a implementacao concreta. Templates EJS vivem em `templates/email/` e recebem dados tipados.

---

## Estrutura do Arquivo

```
backend/
  application/
    services/
      email/
        email-contract.service.ts                <-- Interface abstrata
        nodemailer-email.service.ts              <-- Implementacao producao (Nodemailer + EJS)
        in-memory-email.service.ts               <-- Implementacao testes (in-memory)
    core/
      di-registry.ts                             <-- Registro: Contract -> Nodemailer
  config/
    email.ts                                     <-- Config do Nodemailer (host, port, auth)
  templates/
    email/
      [template-name].ejs                        <-- Templates HTML (EJS)
  start/
    env.ts                                       <-- EMAIL_PROVIDER_* vars
```

---

## Template: Contract Service

```typescript
// services/email/email-contract.service.ts
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
  abstract buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string>;
}
```

## Template: EJS Template

```html
<!-- templates/email/[template-name].ejs -->
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px;">
      <!-- Header com cor tematica -->
      <div style="background-color: {{headerColor}}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">{{titulo}}</h1>
      </div>

      <!-- Corpo do email -->
      <div style="padding: 30px;">
        <p>Ola, <strong><%= name %></strong>!</p>
        <p><%= message %></p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>&copy; <%= new Date().getFullYear() %> {{ProjectName}}</p>
      </div>
    </div>
  </body>
</html>
```

## Template: Uso no Use Case

```typescript
import { Service } from 'fastify-decorators';
import { EmailContractService } from '@application/services/email/email-contract.service';

@Service()
export default class {{Entity}}{{Action}}UseCase {
  constructor(
    private readonly {{entity}}Repository: {{Entity}}ContractRepository,
    private readonly emailService: EmailContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // ... logica de negocio ...

      // Montar template
      const template = await this.emailService.buildTemplate({
        template: '{{template-name}}',
        data: {
          name: entity.name,
          message: 'Sua solicitacao foi aprovada!',
        },
      });

      // Enviar email
      await this.emailService.sendEmail({
        body: template,
        subject: '{{ProjectName}} - {{Assunto do email}}',
        to: [entity.email],
        from: '{{supportEmail}}',
      });

      return right(entity);
    } catch (_error) {
      return left(HTTPException.InternalServerError('Internal server error', 'ERROR_CODE'));
    }
  }
}
```

## Template: In-Memory para Testes

```typescript
// services/email/in-memory-email.service.ts
import type { EmailOptions, EmailResult } from './email-contract.service';
import { EmailContractService } from './email-contract.service';

interface StoredEmail extends EmailOptions {
  id: string;
  sentAt: Date;
}

export default class InMemoryEmailService implements EmailContractService {
  private emails: StoredEmail[] = [];

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const id = crypto.randomUUID();
    this.emails.push({ ...options, id, sentAt: new Date() });
    return { success: true, message: 'Send email successfully', testUrl: id };
  }

  async buildTemplate(payload: { template: string; data: Record<string, any> }): Promise<string> {
    return `[Template: ${payload.template}] ${JSON.stringify(payload.data)}`;
  }

  getLastEmail(): StoredEmail | undefined {
    return this.emails.at(-1);
  }

  clear(): void {
    this.emails = [];
  }
}
```

---

## Exemplo Real

```typescript
// resources/curators/piece-create/piece-create.use-case.ts (trecho)
@Service()
export default class CuratorPieceCreateUseCase {
  constructor(
    private readonly categoryRepository: CategoryContractRepository,
    private readonly pieceRepository: PieceContractRepository,
    private readonly artisanRepository: ArtisanContractRepository,
    private readonly emailService: EmailContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // ... criar peca ...

      const template = await this.emailService.buildTemplate({
        template: 'artisan-piece-relation',
        data: {
          id: piece.id,
          title: piece.title,
          technique: piece.technique,
          materials: piece.materials,
          artisan: piece.artisan,
          category: piece.category,
        },
      });

      await this.emailService.sendEmail({
        body: template,
        subject: `MatisCraft - A obra "${piece.title}" foi adicionada a sua colecao!`,
        to: [email],
        from: 'support@matiscraft.com',
      });

      return right(piece);
    } catch (_error) {
      return left(HTTPException.InternalServerError('Internal server error', 'PIECE_CREATE_ERROR'));
    }
  }
}
```

```typescript
// Teste unitario (trecho)
describe('Curator Piece Create Use Case', () => {
  let emailService: InMemoryEmailService;

  beforeEach(() => {
    emailService = new InMemoryEmailService();
    sut = new CuratorPieceCreateUseCase(
      categoryRepository,
      pieceRepository,
      artisanRepository,
      emailService,
    );
  });

  it('deve criar peca e enviar email', async () => {
    const result = await sut.execute({ ... });
    expect(result.isRight()).toBe(true);

    const lastEmail = emailService.getLastEmail();
    expect(lastEmail?.subject).toContain('foi adicionada');
  });
});
```

**Leitura do exemplo:**

1. O use case injeta `EmailContractService` (contract abstrato) no constructor, nao a implementacao concreta.
2. `buildTemplate` recebe o nome do template (sem extensao) e um objeto `data` com as variaveis do EJS.
3. `sendEmail` recebe `to` como array de emails, `subject` com prefixo "MatisCraft -", e `body` como HTML.
4. No teste, `InMemoryEmailService` substitui o Nodemailer. `getLastEmail()` permite verificar o email enviado.
5. `emailService.clear()` pode ser chamado no `beforeEach` para resetar o estado entre testes.

---

## Registro de DI

```typescript
// core/di-registry.ts (trecho)
import { EmailContractService } from '@application/services/email/email-contract.service';
import NodemailerEmailService from '@application/services/email/nodemailer-email.service';

export function registerDependencies(): void {
  injectablesHolder.injectService(EmailContractService, NodemailerEmailService);
}
```

---

## Configuracao do Nodemailer

```typescript
// config/email.ts
import { Env } from '@start/env';

export const NodemailerEmailProviderConfig = {
  host: Env.EMAIL_PROVIDER_HOST,
  port: Env.EMAIL_PROVIDER_PORT,
  secure: Env.EMAIL_PROVIDER_PORT === 465,
  requireTLS: true,
  auth: {
    user: Env.EMAIL_PROVIDER_USER,
    pass: Env.EMAIL_PROVIDER_PASSWORD,
  },
};
```

---

## Regras e Convencoes

1. **Injetar contract, nunca implementacao** -- use cases recebem `EmailContractService` no constructor. A resolucao e feita pelo DI Registry.

2. **Template name sem extensao** -- `buildTemplate({ template: 'approved-update-request' })` corresponde a `templates/email/approved-update-request.ejs`.

3. **`to` como array** -- mesmo para um unico destinatario, `to` e `string[]`: `to: [email]`.

4. **Subject com prefixo** -- todos os subjects devem comecar com "{{ProjectName}} - " seguido do assunto.

5. **HTML inline styles** -- templates EJS usam estilos inline (nao classes CSS) para compatibilidade com clientes de email.

6. **InMemoryEmailService para testes** -- nunca use o Nodemailer em testes unitarios. Instancie `InMemoryEmailService` diretamente.

7. **`getLastEmail()` para assertions** -- no teste, use `emailService.getLastEmail()` para verificar subject, to, body.

8. **Variaveis de ambiente obrigatorias** -- `EMAIL_PROVIDER_HOST`, `EMAIL_PROVIDER_PORT`, `EMAIL_PROVIDER_USER`, `EMAIL_PROVIDER_PASSWORD` devem estar no `start/env.ts`.

9. **Template responsivo** -- use `max-width: 600px` e `margin: 0 auto` no container principal do template.

10. **Erro no email nao bloqueia operacao** -- se o envio de email falhar, logue o erro mas nao retorne `left()`. A operacao principal (criar, aprovar) deve ter sucesso independente do email.

---

## Checklist

- [ ] O use case injeta `EmailContractService` (contract).
- [ ] O template EJS esta em `templates/email/[nome].ejs`.
- [ ] `buildTemplate` recebe `template` (nome) e `data` (variaveis).
- [ ] `sendEmail` recebe `to` (array), `subject` (com prefixo), `body` (HTML).
- [ ] O DI Registry registra `EmailContractService` → `NodemailerEmailService`.
- [ ] Testes usam `InMemoryEmailService` direto (sem DI).
- [ ] `getLastEmail()` e usado para verificar envio nos testes.
- [ ] Template usa HTML inline styles.
- [ ] Variaveis `EMAIL_PROVIDER_*` estao no `start/env.ts`.
- [ ] Email encoding e `pt-BR`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `Cannot resolve EmailContractService` | Faltou registro no DI Registry | Adicionar `injectService(EmailContractService, NodemailerEmailService)` |
| Template nao encontrado | Nome do template errado ou caminho incorreto | Verificar que o arquivo `.ejs` esta em `templates/email/` |
| Email nao chega | Credenciais SMTP invalidas | Verificar `EMAIL_PROVIDER_*` no `.env` |
| Teste falha com erro de rede | Usando Nodemailer em vez de InMemory | Instanciar `InMemoryEmailService` no teste |
| Variaveis EJS nao substituidas | Nome da variavel no template nao bate com `data` | Verificar `<%= variavel %>` no EJS e `data: { variavel }` no buildTemplate |
| Estilo nao renderiza | Usando classes CSS no template | Trocar para inline styles |

---

**Cross-references:** ver [001-skill-use-case.md](./001-skill-use-case.md), [011-skill-di-registry.md](./011-skill-di-registry.md), [005-skill-teste-unitario.md](./005-skill-teste-unitario.md), [031-skill-validacao-env.md](./031-skill-validacao-env.md).
