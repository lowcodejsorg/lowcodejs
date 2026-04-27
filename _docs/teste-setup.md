# Teste do Setup Wizard

Guia rápido para validar o fluxo de setup do zero.

## 1. Subir o ambiente

Na raiz do projeto:

```bash
chmod +x ./setup.sh
./setup.sh

docker compose up -d mongo --build

cd backend
npm install
npm run seed
npm run dev
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

> Para começar limpo: `docker volume rm low-code-js_mongo-volume` antes de subir.

## 2. Abrir o wizard

Acesse http://localhost:5173 - sem MASTER cadastrado, redireciona para `/setup/admin`.

Verifique também: `GET http://localhost:3000/setup/status` deve responder `{ completed: false, currentStep: "admin", hasAdmin: false }`.

## 3. Percorrer os 7 passos

Em cada tela, preencha e clique em "Salvar e continuar" - a próxima rota deve abrir sozinha.

| # | Step    | URL              | O que preencher                                                          | Validar                                              |
| - | ------- | ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1 | admin   | `/setup/admin`   | Nome, e-mail, senha (mín. 6, 1 maiús, 1 minús, 1 número, 1 especial)     | Cria MASTER e autentica via cookie                   |
| 2 | name    | `/setup/name`    | Nome do sistema + idioma (pt-br ou en-us)                                | Header passa a mostrar o nome digitado               |
| 3 | storage | `/setup/storage` | Switch S3 desligado (local) **ou** ligado + endpoint/região/bucket/keys  | Se S3 ligado, faltar qualquer campo bloqueia avanço  |
| 4 | logos   | `/setup/logos`   | Upload do logo pequeno e grande (imagens, máx. 4MB) — pode pular         | Logos aparecem no header após salvar                 |
| 5 | upload  | `/setup/upload`  | Tamanho máx., qtd. de arquivos por envio, extensões (`jpg;png;pdf`)      | Valores ficam no Setting do Mongo                    |
| 6 | paging  | `/setup/paging`  | Itens por página (10/20/30/40/50)                                        | Listagens passam a usar esse limite                  |
| 7 | email   | `/setup/email`   | SMTP host/porta/user/senha/remetente — **opcional**, pode pular          | Ao concluir, redireciona para `/` (setup finalizado) |

## 4. Casos de erro para conferir rápido

- **Pular passos**: tente abrir `/setup/email` direto após criar o admin → deve aparecer o `BlockedDialog` ("Etapa ainda não pode ser acessada") e voltar para o step atual.
- **Não-MASTER**: faça login como outro usuário e chame `PUT /setup/step/name` → 403 Forbidden.
- **Step fora de ordem (API)**: `PUT /setup/step/storage` enquanto `currentStep` é `name` → 412 com `{ expected: "name" }`.

## 5. Confirmar conclusão

- `GET /setup/status` → `{ completed: true, currentStep: null, hasAdmin: true }`
- Acessar `/setup` agora redireciona para `/`.
- Login com o MASTER criado no passo 1 funciona normalmente.

## 6. Resetar para testar de novo

```bash
docker compose down
docker volume rm low-code-js_mongo-volume
docker compose up -d mongo --build
cd backend && npm run seed
```
