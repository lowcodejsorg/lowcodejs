---
id: authentication-overview
title: Autenticação
---

## Autenticação vs Autorização

- **Autenticação**: Quem é este usuário? (Login/logout, verificação de identidade)
- **Autorização**: O que este usuário pode fazer? (Permissões, papéis, controle de acesso)

## Visão Geral da Arquitetura

### Modelo de Autenticação Full-Stack

**Lado do Servidor (Seguro)**

- Armazenamento e validação de sessão
- Verificação de credenciais do usuário
- Operações no banco de dados
- Geração/verificação de tokens
- Endpoints de API protegidos

**Lado do Cliente (Público)**

- Gerenciamento de estado de autenticação
- Lógica de proteção de rotas
- Interface de login/logout
- Tratamento de redirecionamentos

**Isomórfico (Ambos)**

- Loaders de rota verificando estado de autenticação
- Lógica de validação compartilhada
- Acesso a dados de perfil do usuário

### Padrões de Gerenciamento de Sessão

**Cookies HTTP-Only (Recomendado)**

- Abordagem mais segura - não acessível via JavaScript
- Tratamento automático pelo navegador
- Proteção CSRF integrada com `sameSite`
- Melhor para aplicações web tradicionais

**Tokens JWT**

- Autenticação stateless
- Bom para aplicações API-first
- Requer cuidado no manuseio para evitar vulnerabilidades XSS
- Considere rotação de refresh token

**Sessões no Lado do Servidor**

- Controle centralizado de sessão
- Fácil de revogar sessões
- Requer armazenamento de sessão (banco de dados, Redis)
- Bom para aplicações que exigem controle imediato de sessão

### Arquitetura de Proteção de Rotas

**Padrão de Rota de Layout (Recomendado)**

- Proteja subárvores inteiras de rotas com rotas de layout pai
- Lógica de autenticação centralizada
- Proteção automática para todas as rotas filhas
- Separação limpa entre rotas autenticadas e públicas

**Proteção em Nível de Componente**

- Renderização condicional dentro de componentes
- Controle mais granular sobre estados da UI
- Bom para conteúdo misto público/privado na mesma rota
- Requer cuidado no tratamento para evitar mudanças de layout

**Guards de Server Function**

- Validação no lado do servidor antes de executar operações sensíveis
- Funciona junto com proteção em nível de rota
- Essencial para segurança da API independentemente da proteção no lado do cliente

### Padrões de Gerenciamento de Estado

**Estado Orientado pelo Servidor (Recomendado)**

- Estado de autenticação obtido do servidor a cada requisição
- Sempre atualizado com o estado do servidor
- Funciona perfeitamente com SSR
- Melhor segurança - o servidor é a fonte da verdade

**Estado Baseado em Contexto**

- Gerenciamento de estado de autenticação no lado do cliente
- Bom para provedores de autenticação de terceiros (Auth0, Firebase)
- Requer sincronização cuidadosa com o estado do servidor
- Considere para aplicações altamente interativas client-first

**Abordagem Híbrida**

- Estado inicial do servidor, atualizações no lado do cliente
- Equilíbrio entre segurança e UX
- Validação periódica no lado do servidor

## Opções de Autenticação

### 🏢 Soluções Parceiras

- **[WorkOS](https://workos.com)**
- **[Clerk](https://clerk.dev)**

### 🛠️ Autenticação DIY

Construa seu próprio sistema de autenticação usando server functions e gerenciamento de sessão do TanStack Start:

- **Controle Total**: Personalização completa sobre o fluxo de autenticação
- **Server Functions**: Lógica de autenticação segura no servidor
- **Gerenciamento de Sessão**: Tratamento de sessão integrado com cookies HTTP-only
- **Segurança de Tipos**: Segurança de tipos de ponta a ponta para o estado de autenticação

### 🌐 Outras Excelentes Opções

**Soluções Open Source e da Comunidade:**

- **[Better Auth](https://www.better-auth.com/)** - Biblioteca de autenticação moderna, TypeScript-first
- **[Auth.js](https://authjs.dev/)** (anteriormente NextAuth.js) - Biblioteca de autenticação popular para React

**Serviços Hospedados:**

- **[Supabase Auth](https://supabase.com/auth)** - Alternativa open source ao Firebase com autenticação integrada
- **[Auth0](https://auth0.com/)** - Plataforma de autenticação estabelecida com recursos extensivos
- **[Firebase Auth](https://firebase.google.com/docs/auth)** - Serviço de autenticação do Google

## Soluções Parceiras

### WorkOS - Autenticação Empresarial

<a href="https://workos.com/" alt="WorkOS Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/workos-white.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/workos-black.svg" width="280">
    <img alt="WorkOS logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/workos-black.svg" width="280">
  </picture>
</a>

- **Single Sign-On (SSO)** - Integrações SAML, OIDC e OAuth
- **Directory Sync** - Provisionamento SCIM com Active Directory e Google Workspace
- **Autenticação Multifator** - Opções de segurança de nível empresarial
- **Pronto para Conformidade** - Em conformidade com SOC 2, GDPR e CCPA

[Visite o WorkOS →](https://workos.com/) | [Ver exemplo →](https://github.com/TanStack/router/tree/main/examples/react/start-workos)

### Clerk - Plataforma Completa de Autenticação

<a href="https://go.clerk.com/wOwHtuJ" alt="Clerk Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/clerk-logo-dark.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/clerk-logo-light.svg" width="280">
    <img alt="Clerk logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/clerk-logo-light.svg" width="280">
  </picture>
</a>

- **Componentes de UI Prontos para Uso** - Login, cadastro, perfil de usuário e gerenciamento de organização
- **Logins Sociais** - Google, GitHub, Discord e mais de 20 provedores
- **Autenticação Multifator** - SMS, TOTP e códigos de backup
- **Organizações e Equipes** - Suporte integrado para aplicações baseadas em equipes

[Visite o Clerk →](https://go.clerk.com/wOwHtuJ) | [Cadastre-se gratuitamente →](https://go.clerk.com/PrSDXti) | [Ver exemplo →](https://github.com/TanStack/router/tree/main/examples/react/start-clerk-basic)

## Exemplos

**Soluções Parceiras:**

- [Integração com Clerk](https://github.com/TanStack/router/tree/main/examples/react/start-clerk-basic)
- [Integração com WorkOS](https://github.com/TanStack/router/tree/main/examples/react/start-workos)

**Implementações DIY:**

- [Autenticação Básica com Prisma](https://github.com/TanStack/router/tree/main/examples/react/start-basic-auth)
- [Autenticação com Supabase](https://github.com/TanStack/router/tree/main/examples/react/start-supabase-basic)

**Exemplos no Lado do Cliente:**

- [Autenticação Básica](https://github.com/TanStack/router/tree/main/examples/react/authenticated-routes)
- [Autenticação com Firebase](https://github.com/TanStack/router/tree/main/examples/react/authenticated-routes-firebase)

## Guia de Decisão de Arquitetura

### Escolhendo uma Abordagem de Autenticação

**Soluções Parceiras:**

- Foque na lógica de negócio principal
- Recursos empresariais (SSO, conformidade)
- Segurança e atualizações gerenciadas
- Componentes de UI pré-construídos

**Soluções OSS:**

- Desenvolvimento orientado pela comunidade
- Personalizações específicas
- Soluções auto-hospedadas
- Evitar vendor lock-in

**Implementação DIY:**

- Controle total sobre o fluxo de autenticação
- Requisitos de segurança personalizados
- Necessidades específicas de lógica de negócio
- Propriedade total dos dados de autenticação

### Considerações de Segurança

- Use HTTPS em produção
- Use cookies HTTP-only quando possível
- Valide todas as entradas no servidor
- Mantenha segredos em funções exclusivas do servidor
- Implemente rate limiting para endpoints de autenticação
- Use proteção CSRF para envio de formulários

## Próximos Passos

- **Soluções parceiras** → [Clerk](https://go.clerk.com/wOwHtuJ) ou [WorkOS](https://workos.com/)
- **Implementação DIY** → [Guia de Autenticação](./authentication.md)
- **Exemplos** → [Implementações funcionais](https://github.com/TanStack/router/tree/main/examples/react)

## Recursos

**Guias de Implementação:**

- [Padrões de Autenticação](./authentication.md)
- [Guia de Autenticação do Router](/router/latest/docs/framework/react/guide/authenticated-routes.md)

**Conceitos Fundamentais:**

- [Modelo de Execução](./execution-model.md)
- [Server Functions](./server-functions.md)

**Tutoriais Passo a Passo:**

- [Guias Práticos do Router](/router/latest/docs/framework/react/how-to/README.md#authentication)
