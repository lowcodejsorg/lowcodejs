---
id: authentication
title: Autenticação
---

Este guia aborda padrões de autenticação e mostra como implementar seu próprio sistema de autenticação com o TanStack Start.

> **📋 Antes de Começar:** Consulte nossa [Visão Geral de Autenticação](./authentication-overview.md) para todas as opções disponíveis, incluindo soluções de parceiros e serviços hospedados.

## Abordagens de Autenticação

Você tem várias opções de autenticação na sua aplicação TanStack Start:

**Soluções Hospedadas:**

1. **[Clerk](https://clerk.dev)** - Plataforma completa de autenticação com componentes de UI
2. **[WorkOS](https://workos.com)** - Focado em empresas com SSO e recursos de conformidade
3. **[Better Auth](https://www.better-auth.com/)** - Biblioteca open-source em TypeScript
4. **[Auth.js](https://authjs.dev/)** - Biblioteca open-source com suporte a mais de 80 provedores OAuth

**Benefícios da Implementação DIY:**

- **Controle Total**: Personalização completa sobre o fluxo de autenticação
- **Sem Dependência de Fornecedor**: Você é dono da lógica de autenticação e dos dados dos usuários
- **Requisitos Personalizados**: Implemente lógica de negócio específica ou necessidades de conformidade
- **Controle de Custos**: Sem cobrança por usuário ou limites de uso

A autenticação envolve muitas considerações, incluindo segurança de senhas, gerenciamento de sessões, rate limiting, proteção contra CSRF e diversos vetores de ataque.

## Conceitos Fundamentais

### Autenticação vs Autorização

- **Autenticação**: Quem é este usuário? (Login/logout)
- **Autorização**: O que este usuário pode fazer? (Permissões/funções)

O TanStack Start fornece ferramentas para ambos através de server functions, sessões e proteção de rotas.

## Blocos Essenciais

### 1. Server Functions para Autenticação

Server functions lidam com a lógica sensível de autenticação de forma segura no servidor:

```tsx
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

// Server function de login
export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    // Verificar credenciais (substitua pela sua lógica de autenticação)
    const user = await authenticateUser(data.email, data.password);

    if (!user) {
      return { error: "Invalid credentials" };
    }

    // Criar sessão
    const session = await useAppSession();
    await session.update({
      userId: user.id,
      email: user.email,
    });

    // Redirecionar para a área protegida
    throw redirect({ to: "/dashboard" });
  });

// Server function de logout
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useAppSession();
  await session.clear();
  throw redirect({ to: "/" });
});

// Obter o usuário atual
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useAppSession();
    const userId = session.data.userId;

    if (!userId) {
      return null;
    }

    return await getUserById(userId);
  },
);
```

### 2. Gerenciamento de Sessão

O TanStack Start fornece sessões seguras com cookies HTTP-only:

```tsx
// utils/session.ts
import { useSession } from "@tanstack/react-start/server";

type SessionData = {
  userId?: string;
  email?: string;
  role?: string;
};

export function useAppSession() {
  return useSession<SessionData>({
    // Configuração da sessão
    name: "app-session",
    password: process.env.SESSION_SECRET!, // No mínimo 32 caracteres
    // Opcional: personalizar configurações do cookie
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    },
  });
}
```

### 3. Contexto de Autenticação

Compartilhe o estado de autenticação em toda a sua aplicação:

```tsx
// contexts/auth.tsx
import { createContext, useContext, ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUserFn } from "../server/auth";

type User = {
  id: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useServerFn(getCurrentUserFn);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### 4. Proteção de Rotas

Proteja rotas usando `beforeLoad`:

```tsx
// routes/_authed.tsx - Rota de layout para páginas protegidas
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "../server/auth";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn();

    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    // Passar o usuário para as rotas filhas
    return { user };
  },
});
```

```tsx
// routes/_authed/dashboard.tsx - Rota protegida
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { user } = Route.useRouteContext();

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      {/* Conteúdo do dashboard */}
    </div>
  );
}
```

## Padrões de Implementação

### Autenticação Básica com Email/Senha

```tsx
// server/auth.ts
import bcrypt from "bcryptjs";
import { createServerFn } from "@tanstack/react-start";

// Registro de usuário
export const registerFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { email: string; password: string; name: string }) => data,
  )
  .handler(async ({ data }) => {
    // Verificar se o usuário já existe
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return { error: "User already exists" };
    }

    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Criar usuário
    const user = await createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    // Criar sessão
    const session = await useAppSession();
    await session.update({ userId: user.id });

    return { success: true, user: { id: user.id, email: user.email } };
  });

async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}
```

### Controle de Acesso Baseado em Funções (RBAC)

```tsx
// utils/auth.ts
export const roles = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
} as const;

type Role = (typeof roles)[keyof typeof roles];

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const hierarchy = {
    [roles.USER]: 0,
    [roles.MODERATOR]: 1,
    [roles.ADMIN]: 2,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

// Rota protegida com verificação de função
export const Route = createFileRoute("/_authed/admin/")({
  beforeLoad: async ({ context }) => {
    if (!hasPermission(context.user.role, roles.ADMIN)) {
      throw redirect({ to: "/unauthorized" });
    }
  },
});
```

### Integração com Autenticação Social

```tsx
// Exemplo com provedores OAuth
export const authProviders = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    redirectUri: `${process.env.APP_URL}/auth/google/callback`,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    redirectUri: `${process.env.APP_URL}/auth/github/callback`,
  },
};

export const initiateOAuthFn = createServerFn({ method: "POST" })
  .inputValidator((data: { provider: "google" | "github" }) => data)
  .handler(async ({ data }) => {
    const provider = authProviders[data.provider];
    const state = generateRandomState();

    // Armazenar state na sessão para proteção contra CSRF
    const session = await useAppSession();
    await session.update({ oauthState: state });

    // Gerar URL de OAuth
    const authUrl = generateOAuthUrl(provider, state);

    throw redirect({ href: authUrl });
  });
```

### Fluxo de Redefinição de Senha

```tsx
// Solicitação de redefinição de senha
export const requestPasswordResetFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const user = await getUserByEmail(data.email);
    if (!user) {
      // Não revelar se o email existe
      return { success: true };
    }

    const token = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await savePasswordResetToken(user.id, token, expires);
    await sendPasswordResetEmail(user.email, token);

    return { success: true };
  });

// Confirmação de redefinição de senha
export const resetPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; newPassword: string }) => data)
  .handler(async ({ data }) => {
    const resetToken = await getPasswordResetToken(data.token);

    if (!resetToken || resetToken.expires < new Date()) {
      return { error: "Invalid or expired token" };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await updateUserPassword(resetToken.userId, hashedPassword);
    await deletePasswordResetToken(data.token);

    return { success: true };
  });
```

## Melhores Práticas de Segurança

### 1. Segurança de Senhas

```tsx
// Use hashing forte (bcrypt, scrypt ou argon2)
import bcrypt from "bcryptjs";

const saltRounds = 12; // Ajuste conforme suas necessidades de segurança
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### 2. Segurança de Sessão

```tsx
// Use configuração segura de sessão
export function useAppSession() {
  return useSession({
    name: "app-session",
    password: process.env.SESSION_SECRET!, // 32+ caracteres
    cookie: {
      secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
      sameSite: "lax", // Proteção contra CSRF
      httpOnly: true, // Proteção contra XSS
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    },
  });
}
```

### 3. Rate Limiting

```tsx
// Rate limiting simples em memória (use Redis em produção)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitLogin = (ip: string): boolean => {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 min
    return true;
  }

  if (attempts.count >= 5) {
    return false; // Muitas tentativas
  }

  attempts.count++;
  return true;
};
```

### 4. Validação de Entrada

```tsx
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    // os dados agora estão validados
  });
```

## Testando a Autenticação

### Testes Unitários de Server Functions

```tsx
// __tests__/auth.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { loginFn } from "../server/auth";

describe("Authentication", () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it("should login with valid credentials", async () => {
    const result = await loginFn({
      data: { email: "test@example.com", password: "password123" },
    });

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
  });

  it("should reject invalid credentials", async () => {
    const result = await loginFn({
      data: { email: "test@example.com", password: "wrongpassword" },
    });

    expect(result.error).toBe("Invalid credentials");
  });
});
```

### Testes de Integração

```tsx
// __tests__/auth-flow.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { router } from "../router";

describe("Authentication Flow", () => {
  it("should redirect to login when accessing protected route", async () => {
    const history = createMemoryHistory();
    history.push("/dashboard"); // Rota protegida

    render(<RouterProvider router={router} history={history} />);

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
  });
});
```

## Padrões Comuns

### Estados de Carregamento

```tsx
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const loginMutation = useServerFn(loginFn);

  const handleSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      await loginMutation.mutate(data);
    } catch (error) {
      // Tratar erro
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
      <button disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Funcionalidade "Lembrar de Mim"

```tsx
export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { email: string; password: string; rememberMe?: boolean }) => data,
  )
  .handler(async ({ data }) => {
    const user = await authenticateUser(data.email, data.password);
    if (!user) return { error: "Invalid credentials" };

    const session = await useAppSession();
    await session.update(
      { userId: user.id },
      {
        // Estender a sessão se "lembrar de mim" estiver marcado
        maxAge: data.rememberMe ? 30 * 24 * 60 * 60 : undefined, // 30 dias vs sessão
      },
    );

    return { success: true };
  });
```

## Exemplos Funcionais

Estude estas implementações para entender diferentes padrões de autenticação:

- **[Autenticação Básica com Prisma](https://github.com/TanStack/router/tree/main/examples/react/start-basic-auth)** - Implementação DIY completa com banco de dados e sessões
- **[Integração com Supabase](https://github.com/TanStack/router/tree/main/examples/react/start-supabase-basic)** - Exemplo de integração com serviço de terceiros
- **[Autenticação com Contexto no Cliente](https://github.com/TanStack/router/tree/main/examples/react/authenticated-routes)** - Padrões de autenticação apenas no cliente

## Migração a Partir de Outras Soluções

### A Partir de Autenticação no Cliente

Se você está migrando de autenticação no lado do cliente (localStorage, apenas contexto):

1. Mova a lógica de autenticação para server functions
2. Substitua localStorage por sessões no servidor
3. Atualize a proteção de rotas para usar `beforeLoad`
4. Adicione headers de segurança adequados e proteção contra CSRF

### A Partir de Outros Frameworks

- **Next.js**: Substitua API routes por server functions, migre sessões do NextAuth
- **Remix**: Converta loaders/actions em server functions, adapte os padrões de sessão
- **SvelteKit**: Mova form actions para server functions, atualize a proteção de rotas

## Considerações para Produção

Ao escolher sua abordagem de autenticação, considere estes fatores:

### Comparação entre Hospedado e DIY

**Soluções Hospedadas (Clerk, WorkOS, Better Auth):**

- Medidas de segurança pré-construídas e atualizações regulares
- Componentes de UI e recursos de gerenciamento de usuários
- Certificações de conformidade e trilhas de auditoria
- Suporte e documentação
- Preço por usuário ou por assinatura

**Implementação DIY:**

- Controle completo sobre implementação e dados
- Sem custos recorrentes de assinatura
- Lógica de negócio e workflows personalizados
- Responsabilidade por atualizações de segurança e monitoramento
- Necessidade de lidar com casos extremos e vetores de ataque

### Considerações de Segurança

Sistemas de autenticação precisam lidar com vários aspectos de segurança:

- Hashing de senhas e prevenção de ataques de temporização
- Gerenciamento de sessões e proteção contra fixação de sessão
- Proteção contra CSRF e XSS
- Rate limiting e prevenção de força bruta
- Segurança do fluxo OAuth
- Requisitos de conformidade (LGPD, GDPR, CCPA, etc.)

## Próximos Passos

Ao implementar autenticação, considere:

- **Revisão de Segurança**: Revise sua implementação seguindo as melhores práticas de segurança
- **Performance**: Adicione cache para consultas de usuários e validação de sessões
- **Monitoramento**: Adicione logging e monitoramento para eventos de autenticação
- **Conformidade**: Garanta conformidade com regulamentações relevantes ao armazenar dados pessoais

Para outras abordagens de autenticação, consulte a [Visão Geral de Autenticação](./authentication-overview.md). Para ajuda com integrações específicas, explore nossos [exemplos funcionais](https://github.com/TanStack/router/tree/main/examples/react).
