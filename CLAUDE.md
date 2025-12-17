# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Arquitetura do Projeto

Este é um projeto monorepo usando Turbo com duas aplicações principais:

### Stack Tecnológica

- **Workspace Management**: Turborepo para gerenciamento de monorepo
- **Server** (`/server`): API TypeScript com Fastify + MongoDB (legacy, sendo migrado)
- **Web** (`/web`): React + TypeScript + TanStack Router + Tailwind CSS (nova implementação)
- **Database**: MongoDB com Docker para desenvolvimento local

### Estrutura do Projeto

```
lowcodejs/
├── server/              # API backend (legacy)
├── web/                 # Frontend React (nova implementação)
├── docker-compose.yml   # Configuração MongoDB local
├── turbo.json           # Configuração Turborepo
└── package.json         # Workspace root
```

## Comandos de Desenvolvimento

### Comandos Principais (Root)

```bash
npm run dev       # Inicia desenvolvimento de ambas aplicações
npm run build     # Build de todas as aplicações
npm run lint      # Lint de todo o código
```

### Server (API Backend)

```bash
cd server
npm run dev       # Desenvolvimento com tsx watch
npm run build     # Compilação TypeScript + tsup
npm run start     # Servidor de produção
npm run seed      # Popula banco de dados
```

### Web (Frontend)

```bash
cd web
npm run dev       # Servidor de desenvolvimento Vite
npm run build     # Build de produção
npm run lint      # ESLint
npm run preview   # Preview do build
```

### Banco de Dados

```bash
# Iniciar MongoDB local
docker-compose up -d local-mongo

# Verificar status
docker-compose ps

# Parar serviços
docker-compose down
```

## Configurações Importantes

### Path Aliases

**Server (`/server`)**:

```typescript
"@application/*": ["./application/*"]
"@bin/*": ["./bin/*"]
"@config/*": ["./config/*"]
"@database/*": ["./database/*"]
"@start/*": ["./start/*"]
```

**Web (`/web`)**:

```typescript
"@/*": ["./src/*"]
```

### Ferramentas e Frameworks

**Server**:

- Framework: Fastify v5.6.0
- ORM: Mongoose
- Validação: Zod
- Auth: JWT + cookies
- Docs: Swagger/OpenAPI

**Web**:

- Framework: React 19 + Vite
- Roteamento: TanStack Router
- UI: Tailwind CSS v4 + Radix UI
- Queries: TanStack Query
- Validação: Zod + React Hook Form

## Ambiente de Desenvolvimento

### Variáveis de Ambiente Necessárias

**Server** (`.env`):

```env
PORT=3000
DATABASE_URL=mongodb://local:local@localhost:27017/lowcodejs
JWT_PRIVATE_KEY=base64_encoded_private_key
JWT_PUBLIC_KEY=base64_encoded_public_key
COOKIE_SECRET=your_secret
```

**Web** (`.env`):

```env
VITE_API_URL=http://localhost:3000
```

### MongoDB Local

```yaml
# Configuração já incluída em docker-compose.yml
- Host: localhost:27017
- Usuário: local
- Senha: local
- Database: lowcodejs
```

## Padrões de Desenvolvimento

### Arquitetura do Server (Legacy)

- Clean Architecture com decorators
- Controllers → Use Cases → Models
- Either pattern para tratamento de erros
- Sistema dinâmico de coleções e campos

### Arquitetura do Web (Nova)

- Componentes funcionais React
- File-based routing (TanStack Router)
- Gerenciamento de estado com TanStack Query
- Components/UI organizados com Radix + Tailwind

### Estrutura de Arquivos Web

```
src/
├── components/
│   ├── ui/           # Componentes base (Radix)
│   └── common/       # Componentes específicos
├── routes/           # Páginas (file-based routing)
├── hooks/            # common hooks
├── contexts/         # React contexts
├── lib/              # Utilities, API client
└── assets/           # Recursos estáticos
```

## Características do Sistema

### Sistema Low-Code (Server)

- Criação dinâmica de coleções
- Campos configuráveis com múltiplos tipos
- Relacionamentos entre coleções
- Sistema de permissões baseado em grupos
- Soft delete com sistema de lixeira

### Interface Web

- Dashboard administrativo
- Gerenciamento de coleções e campos
- Interface para dados dinâmicos
- Sistema de autenticação
- Temas claro/escuro

## Migração em Andamento

O projeto está migrando do sistema legacy (`/api` e `/app` removidos) para nova arquitetura:

- **Server**: Mantém API Fastify existente
- **Web**: Nova implementação React substituindo frontend anterior
- Dados do sistema legacy estão sendo preservados na nova interface

## Comandos de Build e Deploy

### Desenvolvimento Local

1. `docker-compose up -d local-mongo`
2. `npm install` (root)
3. `npm run dev`

### Build de Produção

```bash
npm run build
# Gera:
# - server/build/ (API compilada)
# - web/dist/ (Frontend otimizado)
```

### Lint e Qualidade

```bash
npm run lint          # Lint completo
cd server && npm run lint  # Lint apenas server
cd web && npm run lint     # Lint apenas web
```
