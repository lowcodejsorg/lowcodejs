# Config

Arquivos de configuracao de infraestrutura.

| Arquivo | Descricao |
|---------|-----------|
| `database.config.ts` | Conecta Mongoose a `DATABASE_URL` com `autoCreate: true`. Importa todos os models para registrar schemas |
| `storage.config.ts` | DriveManager (Flydrive): driver local (`_storage/`) ou AWS S3. URL publica: `SERVER_URL/storage/filename` |
| `redis.config.ts` | Cliente ioredis a partir de `REDIS_URL`. Log de erros de conexao |
| `email.config.ts` | Transporter Nodemailer: host, port, secure (465), requireTLS, auth |
