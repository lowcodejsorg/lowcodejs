# LowCodeJS API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

## 📋 Sobre o Projeto

LowCodeJS é uma API robusta e flexível desenvolvida para fornecer
funcionalidades de backend para aplicações low-code. A API oferece um sistema
completo de gerenciamento de coleções dinâmicas, autenticação JWT, controle de
permissões e muito mais.

### 🎯 Principais Características

- **Sistema de Coleções Dinâmicas**: Crie e gerencie coleções personalizadas com
  campos configuráveis
- **Autenticação JWT**: Sistema seguro de autenticação com cookies httpOnly
- **Controle de Permissões**: Sistema granular de permissões baseado em grupos
  de usuários
- **Internacionalização**: Suporte a múltiplos idiomas (pt-BR, en-US)
- **Upload de Arquivos**: Sistema de armazenamento de arquivos com controle de
  acesso
- **API RESTful**: Interface bem estruturada seguindo padrões REST
- **Documentação Interativa**: Swagger/OpenAPI com interface Scalar

## 🏗️ Arquitetura do Projeto

```
├── app/                          # Código da aplicação
│   ├── controllers/              # Controladores organizados por domínio
│   │   ├── authentication/       # Autenticação (login, registro, recuperação)
│   │   ├── collections/          # Gerenciamento de coleções
│   │   ├── fields/              # Campos de coleções
│   │   ├── locales/             # Internacionalização
│   │   ├── permissions/         # Permissões
│   │   ├── profile/             # Perfil do usuário
│   │   ├── rows/                # Dados das coleções
│   │   ├── setting/             # Configurações do sistema
│   │   ├── storage/             # Upload e gerenciamento de arquivos
│   │   ├── users/               # Gerenciamento de usuários
│   │   └── user-group/          # Grupos de usuários
│   ├── core/                    # Tipos e entidades centrais
│   ├── exceptions/              # Exceções customizadas
│   ├── middlewares/             # Middlewares (autenticação, recursos)
│   ├── model/                   # Modelos Mongoose
│   ├── services/                # Serviços de negócio
│   └── validators/              # Validadores Zod
├── bin/                         # Ponto de entrada da aplicação
├── config/                      # Configurações (app, database, email)
├── database/                    # Seeders para população de dados
├── start/                       # Inicialização (kernel, env)
└── _system/                     # Arquivos do sistema (locales, configurações)
```

## 🚀 Tecnologias Utilizadas

### Backend Framework

- **[Fastify](https://www.fastify.io/)**: Framework web rápido e eficiente
- **[TypeScript](https://www.typescriptlang.org/)**: Linguagem principal
- **[Fastify Decorators](https://github.com/L2jLiga/fastify-decorators)**:
  Decorators para estruturação de controladores

### Banco de Dados

- **[MongoDB](https://www.mongodb.com/)**: Banco de dados NoSQL
- **[Mongoose](https://mongoosejs.com/)**: ODM para MongoDB

### Autenticação e Segurança

- **[JWT](https://jwt.io/)**: Autenticação baseada em tokens
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)**: Hash de senhas
- **[@fastify/cookie](https://github.com/fastify/fastify-cookie)**:
  Gerenciamento de cookies

### Validação e Documentação

- **[Zod](https://zod.dev/)**: Validação de schemas
- **[@fastify/swagger](https://github.com/fastify/fastify-swagger)**:
  Documentação OpenAPI
- **[@scalar/fastify-api-reference](https://scalar.com/)**: Interface de
  documentação

### Upload e Arquivos

- **[@fastify/multipart](https://github.com/fastify/fastify-multipart)**: Upload
  de arquivos
- **[@fastify/static](https://github.com/fastify/fastify-static)**: Servir
  arquivos estáticos

### Utilitários

- **[date-fns](https://date-fns.org/)**: Manipulação de datas
- **[nodemailer](https://nodemailer.com/)**: Envio de emails
- **[slugify](https://github.com/simov/slugify)**: Geração de slugs
- **[@json2csv/node](https://github.com/juanjoDiaz/json2csv)**: Exportação CSV

## 📊 Modelos de Dados

### Entidades Principais

#### User (Usuário)

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  group: UserGroup;
  createdAt: Date;
  updatedAt: Date;
  trashed: boolean;
  trashedAt: Date;
}
```

#### Collection (Coleção)

```typescript
interface Collection {
  _id: string;
  _schema: CollectionSchema;
  name: string;
  description: string;
  logo: string;
  slug: string;
  fields: Field[];
  type: 'collection' | 'field-group';
  configuration: {
    style: 'gallery' | 'list';
    visibility: 'public' | 'restricted';
    collaboration: 'open' | 'restricted';
    administrators: User[];
    owner: User;
    fields: {
      orderList: string[];
      orderForm: string[];
    };
  };
}
```

#### Field (Campo)

```typescript
interface Field {
  _id: string;
  name: string;
  slug: string;
  type: FIELD_TYPE;
  configuration: {
    required: boolean;
    multiple: boolean;
    format: FIELD_FORMAT;
    listing: boolean;
    filtering: boolean;
    defaultValue: string;
    relationship: FieldConfigurationRelationship;
    dropdown: string[];
    category: Category[];
    group: FieldConfigurationGroup;
  };
}
```

### Tipos de Campos Suportados

- **TEXT_SHORT**: Texto curto (alfanumérico, integer, decimal, URL, email)
- **TEXT_LONG**: Texto longo
- **DROPDOWN**: Lista de opções
- **DATE**: Data com múltiplos formatos
- **RELATIONSHIP**: Relacionamento entre coleções
- **FILE**: Upload de arquivos
- **FIELD_GROUP**: Grupo de campos
- **REACTION**: Sistema de curtidas
- **EVALUATION**: Sistema de avaliações
- **CATEGORY**: Categorização hierárquica

## 🛠️ Casos de Uso

### 1. Gerenciamento de Usuários

- **Registro e login** de usuários
- **Recuperação de senha** via email
- **Gerenciamento de perfil**
- **Controle de status** (ativo/inativo)

### 2. Sistema de Permissões

- **Grupos de usuários** com permissões específicas
- **Controle granular** de acesso
- **Administradores** de coleções
- **Proprietários** de conteúdo

### 3. Coleções Dinâmicas

- **Criação de coleções** personalizadas
- **Campos configuráveis** com múltiplos tipos
- **Relacionamentos** entre coleções
- **Validação automática** baseada em configurações

### 4. Gerenciamento de Conteúdo

- **CRUD completo** para registros
- **Sistema de lixeira** (soft delete)
- **Filtros e busca** avançada
- **Paginação** de resultados

### 5. Upload e Armazenamento

- **Upload de arquivos** com validação
- **Controle de acesso** a arquivos
- **Metadados** de arquivos
- **Integração** com campos de coleção

### 6. Internacionalização

- **Múltiplos idiomas** (pt-BR, en-US)
- **Configuração dinâmica** de idioma padrão
- **Labels localizados** para interface

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18
- MongoDB
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/lowcodejs-api.git
cd lowcodejs-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Configure as seguintes variáveis no arquivo `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/lowcodejs

# JWT
JWT_PRIVATE_KEY=base64_encoded_private_key
JWT_PUBLIC_KEY=base64_encoded_public_key

# Cookie
COOKIE_SECRET=your_cookie_secret

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_password
```

### 4. Gere as chaves JWT

```bash
./credential-generator.sh
```

### 5. Execute as migrações (seeders)

```bash
npm run seed
```

### 6. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📚 API Endpoints

### Autenticação

- `POST /authentication/sign-up` - Registro de usuário
- `POST /authentication/sign-in` - Login
- `POST /authentication/refresh-token` - Renovar token
- `POST /authentication/recovery/request-code` - Solicitar código de recuperação
- `POST /authentication/recovery/validate-code` - Validar código
- `POST /authentication/recovery/update-password` - Atualizar senha

### Usuários

- `GET /users` - Listar usuários (paginado)
- `POST /users` - Criar usuário
- `GET /users/:id` - Obter usuário por ID
- `PUT /users/:id` - Atualizar usuário

### Coleções

- `GET /collections` - Listar coleções
- `POST /collections` - Criar coleção
- `GET /collections/:slug` - Obter coleção por slug
- `PUT /collections/:id` - Atualizar coleção
- `POST /collections/:id/trash` - Enviar para lixeira
- `DELETE /collections/:id` - Excluir permanentemente

### Campos

- `GET /fields` - Listar campos
- `POST /fields` - Criar campo
- `PUT /fields/:id` - Atualizar campo
- `DELETE /fields/:id` - Excluir campo

### Registros (Rows)

- `GET /rows` - Listar registros
- `POST /rows` - Criar registro
- `GET /rows/:id` - Obter registro
- `PUT /rows/:id` - Atualizar registro
- `DELETE /rows/:id` - Excluir registro

### Upload

- `POST /storage` - Upload de arquivo
- `GET /storage/:id` - Download de arquivo
- `DELETE /storage/:id` - Excluir arquivo

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em modo desenvolvimento
npm run build            # Compila TypeScript para JavaScript
npm start               # Inicia servidor de produção
npm run seed            # Executa seeders do banco

# Qualidade de Código
npm run lint            # Executa ESLint
npm run format          # Formata código com Prettier

# Docker
docker-compose up       # Sobe ambiente completo
```

## 📖 Documentação da API

A documentação interativa da API está disponível em:

- **Desenvolvimento**: http://localhost:3000/documentation
- **OpenAPI JSON**: http://localhost:3000/openapi.json

## 🔒 Segurança

- **Autenticação JWT**: Tokens assinados com RSA256
- **Cookies HttpOnly**: Tokens armazenados de forma segura
- **Hash de senhas**: bcrypt para proteção de senhas
- **CORS configurado**: Controle de origem das requisições
- **Validação de entrada**: Zod para validação rigorosa
- **Rate limiting**: Proteção contra ataques de força bruta

## 🌍 Internacionalização

O sistema suporta múltiplos idiomas através de arquivos de propriedades:

- `_system/locales/pt-br.properties`
- `_system/locales/en-us.properties`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo
[LICENSE](LICENSE) para detalhes.

## 👥 Equipe

- **Desenvolvimento**: Equipe LowCodeJS
- **Manutenção**: [Seu Nome](https://github.com/seu-usuario)

## 📞 Suporte

Para suporte e dúvidas:

- **Issues**:
  [GitHub Issues](https://github.com/seu-usuario/lowcodejs-api/issues)
- **Email**: suporte@lowcodejs.org
- **Documentação**: [Docs](https://docs.lowcodejs.org)

---

**LowCodeJS API** - Construindo o futuro das aplicações low-code 🚀
