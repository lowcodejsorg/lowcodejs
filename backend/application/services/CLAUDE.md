# Services

Servicos para concerns cross-cutting. Mesmo pattern de Contract + Implementation dos repositories.

## Email Service (`email/`)

| Arquivo | Descricao |
|---------|-----------|
| `email-contract.service.ts` | Abstract class: `sendEmail(options)`, `buildTemplate(payload)` |
| `nodemailer-email.service.ts` | Implementacao SMTP via Nodemailer. Filtra emails validos, gera versao texto. Em dev retorna testUrl (Ethereal) |
| `in-memory-email.service.ts` | Mock para testes |

Registrado no DI: `injectablesHolder.injectService(EmailContractService, NodemailerEmailService)`

## Storage Service (`flydrive-storage.service.ts`)

| Metodo | Descricao |
|--------|-----------|
| `upload(part, staticName?)` | Upload de arquivo. Imagens convertidas para WebP 1200x1200. |
| `delete(filename)` | Remove arquivo |
| `exists(filename)` | Verifica existencia |

**Nota:** Ainda nao segue o pattern contract. Candidato a formalizacao futura.

## Para Criar Novo Service

1. Crie diretorio `services/{nome}/`
2. Crie `{nome}-contract.service.ts` com abstract class
3. Crie implementacao concreta
4. Crie `in-memory-{nome}.service.ts` para testes
5. Registre em `core/di-registry.ts`
