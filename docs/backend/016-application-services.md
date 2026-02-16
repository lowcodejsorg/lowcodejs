# Servicos

O diretorio `services/` contem servicos de infraestrutura para upload de arquivos e envio de emails.

---

## storage.service.ts - LocalStorageService

Servico de armazenamento local de arquivos com processamento de imagens via `sharp`.

### Classe

```typescript
@Service()
export default class LocalStorageService {
  private readonly storagePath = join(process.cwd(), '_storage');
  private readonly baseUrl = Env.APP_SERVER_URL;

  private readonly IMAGE_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ];
}
```

### Diretorio de Armazenamento

Todos os arquivos sao salvos em `backend/_storage/`. O diretorio e criado automaticamente se nao existir.

### upload(part: MultipartFile)

Processa e armazena um arquivo enviado via multipart/form-data.

**Processamento de imagens:** Imagens nos formatos JPEG, PNG, GIF, BMP e TIFF sao automaticamente:
- Redimensionadas para no maximo 1200x1200 pixels (mantendo proporcao, sem ampliar)
- Convertidas para formato WebP com qualidade 80%

**Outros arquivos:** Armazenados como recebidos, sem processamento.

```typescript
async upload(part: MultipartFile): Promise<Response> {
  await this.ensureStorageExists();

  const name = Math.floor(Math.random() * 100000000)?.toString();
  const originalExt = part.filename?.split('.').pop();
  const buffer = await part.toBuffer();

  let finalBuffer: Buffer;
  let finalExt: string;
  let finalMimetype: string;

  if (this.isProcessableImage(part.mimetype)) {
    // Imagens: resize + webp
    finalBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    finalExt = 'webp';
    finalMimetype = 'image/webp';
  } else {
    // Outros: armazena como esta
    finalBuffer = buffer;
    finalExt = originalExt!;
    finalMimetype = part.mimetype;
  }

  const filename = name.concat('.').concat(finalExt);
  const filePath = resolve(this.storagePath, filename);
  await writeFile(filePath, finalBuffer);

  return {
    filename,
    mimetype: finalMimetype,
    url: this.baseUrl.concat('/storage/').concat(filename),
    originalName: part.filename,
    size: finalBuffer.length,
  };
}
```

**Retorno:**

```typescript
{
  filename: string;      // Nome gerado (ex: "45678901.webp")
  mimetype: string;      // Tipo MIME final (ex: "image/webp")
  url: string;           // URL completa de acesso
  originalName: string;  // Nome original do upload
  size: number;          // Tamanho em bytes
}
```

### delete(filename: string)

Remove um arquivo do disco.

```typescript
async delete(filename: string): Promise<boolean> {
  try {
    const filePath = resolve(this.storagePath, filename);
    await unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
```

Retorna `true` se removido com sucesso, `false` em caso de erro.

### exists(filename: string)

Verifica se um arquivo existe no disco.

```typescript
async exists(filename: string): Promise<boolean> {
  try {
    const filePath = resolve(this.storagePath, filename);
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

---

## email/ - Servico de Email

### EmailContractService (Contrato Abstrato)

Define a interface que todas as implementacoes de email devem seguir.

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
  abstract buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string>;
}
```

### NodemailerEmailService

Implementacao de producao usando Nodemailer.

```typescript
@Service()
export default class NodemailerEmailService extends EmailContractService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    super();
    this.setupTransporter();
  }
}
```

#### sendEmail(options: EmailOptions)

Envia um email usando o transportador Nodemailer configurado.

```typescript
async sendEmail(options: EmailOptions): Promise<EmailResult> {
  // 1. Verifica se o transportador esta configurado
  if (!this.transporter) {
    return { success: false, message: 'Transportador de email nao configurado' };
  }

  // 2. Valida emails com regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = options.to.filter((email) => emailRegex.test(email));
  if (validEmails.length === 0) {
    return { success: false, message: 'Nenhum email valido fornecido' };
  }

  // 3. Envia o email
  const result = await this.transporter.sendMail({
    from: options.from,
    to: validEmails.join(', '),
    subject: options.subject,
    html: options.body,
    text: options.body.replace(/<[^>]*>/g, ''),  // Versao texto sem HTML
  });

  // 4. Em ambiente nao-producao, retorna URL de teste (Ethereal/Mailtrap)
  let testUrl: string | boolean | undefined;
  if (process.env.NODE_ENV !== 'production') {
    const url = nodemailer.getTestMessageUrl(result);
    testUrl = url || undefined;
  }

  return { success: true, message: 'Email enviado com sucesso', testUrl };
}
```

**Caracteristicas:**
- Filtra emails invalidos antes do envio
- Gera versao texto puro automaticamente (remove tags HTML)
- Em ambientes de desenvolvimento/teste, retorna `testUrl` para preview

#### buildTemplate(payload)

Renderiza um template EJS para gerar o corpo do email.

```typescript
async buildTemplate(payload: {
  template: string;
  data: Record<string, unknown>;
}): Promise<string> {
  const file = join(process.cwd(), 'templates', 'email', payload.template.concat('.ejs'));
  return await renderFile(file, payload.data);
}
```

Os templates EJS ficam em `backend/templates/email/`. O parametro `template` e o nome do arquivo sem extensao (ex: `"notification"` busca `templates/email/notification.ejs`).

### InMemoryEmailService

Implementacao para testes que armazena emails em memoria.

```typescript
export default class InMemoryEmailService extends EmailContractService {
  private emails: StoredEmail[] = [];

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    this.emails.push({ ...options, sentAt: new Date() });
    return { success: true, message: 'Email stored in memory (test mode)' };
  }

  async buildTemplate(payload: {
    template: string;
    data: Record<string, unknown>;
  }): Promise<string> {
    return `[Template: ${payload.template}] Data: ${JSON.stringify(payload.data)}`;
  }

  // Metodos auxiliares para testes
  getLastEmail(): StoredEmail | undefined;
  getEmails(): StoredEmail[];
  clear(): void;
}
```

**Metodos auxiliares para assertions em testes:**

| Metodo | Descricao |
|---|---|
| `getLastEmail()` | Retorna o ultimo email enviado |
| `getEmails()` | Retorna copia de todos os emails |
| `clear()` | Limpa todos os emails armazenados |

---

## Registro no Container DI

O `EmailContractService` e registrado no `di-registry.ts`:

```typescript
injectablesHolder.injectService(EmailContractService, NodemailerEmailService);
```

O `LocalStorageService` usa o decorator `@Service()` diretamente (singleton gerenciado pelo fastify-decorators) e nao precisa de registro manual no DI, pois nao possui contrato abstrato -- e injetado diretamente por tipo concreto.
