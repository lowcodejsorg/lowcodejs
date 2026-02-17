# Diretorio `config/`

## Visao Geral

O diretorio `config/` contem arquivos de configuracao para servicos externos e utilitarios compartilhados pela aplicacao. Sao tres arquivos, cada um com uma responsabilidade especifica.

---

## Estrutura

```
config/
├── database.config.ts    # Conexao com MongoDB via Mongoose
├── email.config.ts       # Configuracao do provedor de email (Nodemailer)
└── util.config.ts        # Funcoes utilitarias (comparacao de senha)
```

---

## `database.config.ts`

Responsavel por estabelecer a conexao com o MongoDB e registrar todos os modelos Mongoose da aplicacao.

### Codigo fonte

```typescript
import mongoose from 'mongoose';

import { Env } from '@start/env';

import '@application/model/evaluation.model';
import '@application/model/field.model';
import '@application/model/permission.model';
import '@application/model/reaction.model';
import '@application/model/storage.model';
import '@application/model/table.model';
import '@application/model/user-group.model';
import '@application/model/user.model';
import '@application/model/validation-token.model';

export async function MongooseConnect(): Promise<void> {
  try {
    await mongoose.connect(Env.DATABASE_URL, {
      autoCreate: true,
      dbName: Env.DB_NAME,
    });
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
```

### Funcao `MongooseConnect()`

Conecta ao MongoDB utilizando as variaveis de ambiente `DATABASE_URL` e `DB_NAME`.

**Parametros de conexao:**

| Parametro | Valor | Descricao |
|---|---|---|
| `autoCreate` | `true` | Cria o banco automaticamente se nao existir |
| `dbName` | `Env.DB_NAME` | Nome do banco (padrao: `lowcodejs`) |

**Comportamento em caso de erro:**
1. Loga o erro no console
2. Desconecta do MongoDB (`mongoose.disconnect()`)
3. Encerra o processo com `process.exit(1)`

### Modelos importados

A importacao dos modelos e feita via side-effect imports (sem variavel), garantindo que todos os schemas Mongoose estejam registrados antes de qualquer operacao no banco:

| Modelo | Arquivo |
|---|---|
| Evaluation | `@application/model/evaluation.model` |
| Field | `@application/model/field.model` |
| Permission | `@application/model/permission.model` |
| Reaction | `@application/model/reaction.model` |
| Storage | `@application/model/storage.model` |
| Table | `@application/model/table.model` |
| User Group | `@application/model/user-group.model` |
| User | `@application/model/user.model` |
| Validation Token | `@application/model/validation-token.model` |

### Variaveis de ambiente

| Variavel | Tipo | Obrigatoria | Descricao |
|---|---|---|---|
| `DATABASE_URL` | `string` | Sim | URL de conexao com o MongoDB (ex: `mongodb://localhost:27017`) |
| `DB_NAME` | `string` | Nao | Nome do banco de dados (padrao: `lowcodejs`) |

---

## `email.config.ts`

Exporta o objeto de configuracao para o provedor de email via Nodemailer.

### Codigo fonte

```typescript
import { Env } from '@start/env';

export const NodemailerEmailProviderConfig = {
  host: Env.EMAIL_PROVIDER_HOST,
  port: Env.EMAIL_PROVIDER_PORT,
  secure: Env.EMAIL_PROVIDER_PORT === 465, // true for port 465, false for other ports
  requireTLS: true,
  auth: {
    user: Env.EMAIL_PROVIDER_USER,
    pass: Env.EMAIL_PROVIDER_PASSWORD,
  },
};
```

### Objeto `NodemailerEmailProviderConfig`

Este objeto e utilizado pelo servico `NodemailerEmailService` para criar o transporte de email.

**Propriedades:**

| Propriedade | Tipo | Descricao |
|---|---|---|
| `host` | `string` | Host do servidor SMTP |
| `port` | `number` | Porta do servidor SMTP |
| `secure` | `boolean` | `true` quando a porta e 465 (SSL/TLS implicito), `false` para outras portas |
| `requireTLS` | `boolean` | Sempre `true`, exige conexao TLS (STARTTLS para portas != 465) |
| `auth.user` | `string` | Usuario de autenticacao SMTP |
| `auth.pass` | `string` | Senha de autenticacao SMTP |

### Logica de seguranca

A propriedade `secure` e determinada automaticamente pela porta:
- **Porta 465**: `secure = true` (SSL/TLS implicito)
- **Outras portas** (ex: 587): `secure = false`, mas `requireTLS = true` forca o uso de STARTTLS

### Variaveis de ambiente

| Variavel | Tipo | Obrigatoria | Descricao |
|---|---|---|---|
| `EMAIL_PROVIDER_HOST` | `string` | Sim | Host do servidor SMTP |
| `EMAIL_PROVIDER_PORT` | `number` | Sim | Porta do servidor SMTP |
| `EMAIL_PROVIDER_USER` | `string` | Sim | Usuario SMTP |
| `EMAIL_PROVIDER_PASSWORD` | `string` | Sim | Senha SMTP |

---

## `util.config.ts`

Contem funcoes utilitarias de uso geral no sistema.

### Codigo fonte

```typescript
import bcrypt from 'bcryptjs';

export async function isPasswordMatch(payload: {
  plain: string;
  hashed: string;
}): Promise<boolean> {
  const doesPasswordMatch = await bcrypt.compare(payload.plain, payload.hashed);
  return doesPasswordMatch;
}
```

### Funcao `isPasswordMatch()`

Compara uma senha em texto plano com um hash bcrypt.

**Parametros:**

| Parametro | Tipo | Descricao |
|---|---|---|
| `payload.plain` | `string` | Senha em texto plano fornecida pelo usuario |
| `payload.hashed` | `string` | Hash bcrypt armazenado no banco de dados |

**Retorno:** `Promise<boolean>` - `true` se a senha corresponde ao hash, `false` caso contrario.

**Exemplo de uso:**

```typescript
const match = await isPasswordMatch({
  plain: 'senha-do-usuario',
  hashed: '$2a$06$...',
});

if (!match) {
  return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));
}
```

### Dependencia

Utiliza a biblioteca `bcryptjs` para comparacao de hashes. O bcryptjs e uma implementacao em JavaScript puro do bcrypt, sem dependencias nativas (nao requer compilacao em C++).
