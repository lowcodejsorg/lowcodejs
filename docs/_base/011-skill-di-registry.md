# Skill: DI Registry

O arquivo `di-registry.ts` centraliza todos os bindings de Dependency Injection da aplicacao. Ele mapeia cada contract (interface abstrata) para sua implementacao concreta usando o `injectablesHolder` do `fastify-decorators`. Quando o kernel inicializa a aplicacao, este arquivo e executado antes do bootstrap, garantindo que todos os services e repositories estejam resolvidos corretamente em tempo de execucao.

---

## Estrutura do Arquivo

```
backend/
  application/
    core/
      di-registry.ts       <-- arquivo unico de registro
    repositories/
      user/
        user-contract.repository.ts
        user-mongoose.repository.ts
    services/
      email/
        email-contract.service.ts
        nodemailer-email.service.ts
```

- O arquivo vive em `backend/application/core/di-registry.ts`.
- Importa todos os contracts e todas as implementacoes concretas.
- Exporta uma unica funcao `registerDependencies()`.

---

## Template

```typescript
import { injectablesHolder } from 'fastify-decorators';

// Contracts (abstratos)
import { {{Entity}}ContractRepository } from '@application/repositories/{{entity}}/{{entity}}-contract.repository';
// Implementacoes (concretas)
import {{Entity}}MongooseRepository from '@application/repositories/{{entity}}/{{entity}}-mongoose.repository';

// Contracts de services
import { {{Service}}ContractService } from '@application/services/{{service}}/{{service}}-contract.service';
// Implementacoes de services
import {{Implementation}}Service from '@application/services/{{service}}/{{implementation}}-{{service}}.service';

export function registerDependencies(): void {
  // Repositories
  injectablesHolder.injectService({{Entity}}ContractRepository, {{Entity}}MongooseRepository);

  // Services
  injectablesHolder.injectService({{Service}}ContractService, {{Implementation}}Service);
}
```

---

## Exemplo Real

```typescript
import { injectablesHolder } from 'fastify-decorators';

import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import UserMongooseRepository from '@application/repositories/user/user-mongoose.repository';
import { EmailContractService } from '@application/services/email/email-contract.service';
import NodemailerEmailService from '@application/services/email/nodemailer-email.service';

export function registerDependencies(): void {
  injectablesHolder.injectService(UserContractRepository, UserMongooseRepository);
  injectablesHolder.injectService(EmailContractService, NodemailerEmailService);
  // ... mais registros por entidade
}
```

**Leitura do exemplo:**

1. `UserContractRepository` e o contract abstrato que define a interface do repository.
2. `UserMongooseRepository` e a implementacao concreta que usa Mongoose/MongoDB.
3. `injectablesHolder.injectService(Contract, Implementacao)` registra o binding: sempre que o container resolver `UserContractRepository`, ele entregara uma instancia de `UserMongooseRepository`.
4. O mesmo padrao se aplica a services: `EmailContractService` e resolvido como `NodemailerEmailService`.

---

## Regras e Convencoes

1. **Um registro por entidade** -- cada entidade/servico recebe exatamente uma linha de `injectService`.
2. **Contract primeiro, implementacao depois** -- a ordem dos argumentos e sempre `(Contract, Implementacao)`.
3. **Trocar implementacao aqui** -- ao migrar de ORM (ex.: Mongoose para Prisma) ou de provider (ex.: Nodemailer para SendGrid), basta alterar o segundo argumento do `injectService`. Nenhum outro arquivo precisa mudar.
4. **Chamado no kernel antes do bootstrap** -- a funcao `registerDependencies()` e invocada pelo kernel durante a fase de inicializacao, antes de qualquer route ou controller ser carregado (ver `014-skill-kernel.md`).
5. **Imports agrupados** -- organize os imports em blocos logicos: primeiro contracts de repositories, depois suas implementacoes, depois contracts de services, depois suas implementacoes.
6. **Arquivo unico** -- todo o registro de dependencias fica concentrado neste arquivo. Nao crie registros espalhados em outros modulos.

---

## Checklist

- [ ] O arquivo esta em `backend/application/core/di-registry.ts`.
- [ ] A funcao exportada se chama `registerDependencies` e retorna `void`.
- [ ] Cada `injectService` recebe `(Contract, Implementacao)` nessa ordem.
- [ ] Existe exatamente um registro por entidade/servico.
- [ ] Os imports de contracts usam named import (`{ ContractName }`).
- [ ] Os imports de implementacoes usam default import (`ImportName`).
- [ ] O kernel chama `registerDependencies()` antes do bootstrap.
- [ ] Ao trocar ORM/provider, apenas o segundo argumento foi alterado.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `Cannot resolve dependency` em runtime | O binding nao foi registrado no `di-registry.ts` | Adicionar a linha `injectablesHolder.injectService(Contract, Implementacao)` |
| Ordem invertida `(Implementacao, Contract)` | Os argumentos foram passados na ordem errada | Sempre usar `(Contract, Implementacao)` -- o contract abstrato vem primeiro |
| Injecao resolvendo a implementacao antiga | O import da implementacao nao foi atualizado apos troca de provider | Verificar se o import aponta para a nova implementacao concreta |
| `registerDependencies` nao executado | O kernel nao esta chamando a funcao antes do bootstrap | Garantir que o kernel invoca `registerDependencies()` na fase de inicializacao (ver `014-skill-kernel.md`) |
| Registro duplicado para mesma entidade | Duas linhas de `injectService` com o mesmo contract | Manter apenas uma linha por contract; a segunda sobrescreve a primeira silenciosamente |
| Import circular | A implementacao importa algo que depende do registry | Revisar a arvore de dependencias; o registry so deve importar contracts e implementacoes finais |

---

**Cross-references:** ver [009-skill-repository.md](./009-skill-repository.md), [012-skill-service.md](./012-skill-service.md), [014-skill-kernel.md](./014-skill-kernel.md).
