# 🔐 Implementação RBAC com MongoDB + Fastify + React

Vou te dar uma estrutura completa para implementar esse sistema de permissões.

---

## 📋 Estrutura de Pastas Sugerida

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── middleware/
│   │   │       ├── authenticate.ts
│   │   │       └── authorize.ts
│   │   ├── users/
│   │   │   ├── user.model.ts
│   │   │   ├── user.controller.ts
│   │   │   └── user.service.ts
│   │   ├── groups/
│   │   │   ├── group.model.ts
│   │   │   └── group.seed.ts
│   │   ├── lists/
│   │   │   ├── list.model.ts
│   │   │   ├── list.controller.ts
│   │   │   ├── list.service.ts
│   │   │   └── list.routes.ts
│   │   └── permissions/
│   │       ├── permission.service.ts
│   │       └── permission.constants.ts
│   └── app.ts

frontend/
├── src/
│   ├── lib/
│   │   ├── api.ts
│   │   └── permissions.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── usePermission.ts
│   ├── components/
│   │   ├── guards/
│   │   │   ├── PermissionGuard.tsx
│   │   │   └── RoleGuard.tsx
│   │   └── ui/ (shadcn)
│   └── contexts/
│       └── AuthContext.tsx
```

---

## 🗄️ Models (Mongoose)

### 1. User Model

```typescript
// backend/src/modules/users/user.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  groupSlug: "master" | "administrator" | "manager" | "registered";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    groupSlug: {
      type: String,
      enum: ["master", "administrator", "manager", "registered"],
      default: "registered",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
```

### 2. Group Model (para seeding)

```typescript
// backend/src/modules/groups/group.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  slug: string;
  permissions: string[];
  level: number;
}

const groupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  permissions: [{ type: String }],
  level: { type: Number, required: true },
});

export const Group = mongoose.model<IGroup>("Group", groupSchema);
```

### 3. List Model

```typescript
// backend/src/modules/lists/list.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type ListType = "restricted" | "open" | "public" | "form";

export interface IListInvite {
  userId: Types.ObjectId;
  permissions: string[];
}

export interface IList extends Document {
  name: string;
  slug: string;
  type: ListType;
  ownerId: Types.ObjectId;
  invites: IListInvite[];
  fields: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["restricted", "open", "public", "form"],
      default: "restricted",
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invites: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        permissions: [{ type: String }],
      },
    ],
    fields: [{ type: Schema.Types.ObjectId, ref: "Field" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const List = mongoose.model<IList>("List", listSchema);
```

### 4. Field Model

```typescript
// backend/src/modules/lists/field.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IField extends Document {
  listId: Types.ObjectId;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options?: string[];
  order: number;
}

const fieldSchema = new Schema<IField>(
  {
    listId: { type: Schema.Types.ObjectId, ref: "List", required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "date", "boolean", "select"],
      default: "text",
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Field = mongoose.model<IField>("Field", fieldSchema);
```

### 5. Row Model

```typescript
// backend/src/modules/lists/row.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRow extends Document {
  listId: Types.ObjectId;
  data: Record<string, any>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rowSchema = new Schema<IRow>(
  {
    listId: { type: Schema.Types.ObjectId, ref: "List", required: true },
    data: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Row = mongoose.model<IRow>("Row", rowSchema);
```

---

## 🔑 Constantes de Permissões

```typescript
// backend/src/modules/permissions/permission.constants.ts

export const PERMISSIONS = {
  // Lists
  LISTS_CREATE: "lists.create",
  LISTS_READ: "lists.read",
  LISTS_UPDATE: "lists.update",
  LISTS_DELETE: "lists.delete",

  // Fields
  FIELDS_CREATE: "fields.create",
  FIELDS_READ: "fields.read",
  FIELDS_UPDATE: "fields.update",
  FIELDS_DELETE: "fields.delete",

  // Rows
  ROWS_CREATE: "rows.create",
  ROWS_READ: "rows.read",
  ROWS_UPDATE: "rows.update",
  ROWS_DELETE: "rows.delete",
} as const;

export const GROUPS = {
  MASTER: "master",
  ADMINISTRATOR: "administrator",
  MANAGER: "manager",
  REGISTERED: "registered",
} as const;

export const GROUP_LEVELS = {
  [GROUPS.MASTER]: 4,
  [GROUPS.ADMINISTRATOR]: 3,
  [GROUPS.MANAGER]: 2,
  [GROUPS.REGISTERED]: 1,
} as const;

export const GROUP_PERMISSIONS = {
  [GROUPS.MASTER]: [
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.LISTS_DELETE,
    PERMISSIONS.FIELDS_CREATE,
    PERMISSIONS.FIELDS_READ,
    PERMISSIONS.FIELDS_UPDATE,
    PERMISSIONS.FIELDS_DELETE,
    PERMISSIONS.ROWS_CREATE,
    PERMISSIONS.ROWS_READ,
    PERMISSIONS.ROWS_UPDATE,
    PERMISSIONS.ROWS_DELETE,
  ],
  [GROUPS.ADMINISTRATOR]: [
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.LISTS_DELETE,
    PERMISSIONS.FIELDS_CREATE,
    PERMISSIONS.FIELDS_READ,
    PERMISSIONS.FIELDS_UPDATE,
    PERMISSIONS.FIELDS_DELETE,
    PERMISSIONS.ROWS_CREATE,
    PERMISSIONS.ROWS_READ,
    PERMISSIONS.ROWS_UPDATE,
    PERMISSIONS.ROWS_DELETE,
  ],
  [GROUPS.MANAGER]: [
    PERMISSIONS.LISTS_CREATE,
    PERMISSIONS.LISTS_READ,
    PERMISSIONS.LISTS_UPDATE,
    PERMISSIONS.FIELDS_CREATE,
    PERMISSIONS.FIELDS_READ,
    PERMISSIONS.FIELDS_UPDATE,
    PERMISSIONS.FIELDS_DELETE,
    PERMISSIONS.ROWS_CREATE,
    PERMISSIONS.ROWS_READ,
    PERMISSIONS.ROWS_UPDATE,
    PERMISSIONS.ROWS_DELETE,
  ],
  [GROUPS.REGISTERED]: [PERMISSIONS.ROWS_READ],
} as const;
```

---

## 🛡️ Permission Service (Lógica Principal)

```typescript
// backend/src/modules/permissions/permission.service.ts
import { Types } from "mongoose";
import { IUser } from "../users/user.model";
import { IList, ListType } from "../lists/list.model";
import {
  GROUP_PERMISSIONS,
  GROUP_LEVELS,
  GROUPS,
} from "./permission.constants";

export class PermissionService {
  /**
   * Verifica se o usuário tem uma permissão específica no grupo
   */
  hasGroupPermission(user: IUser, permission: string): boolean {
    const groupPermissions = GROUP_PERMISSIONS[user.groupSlug] || [];
    return groupPermissions.includes(permission);
  }

  /**
   * Verifica se o usuário é dono da lista
   */
  isOwner(userId: Types.ObjectId, list: IList): boolean {
    return list.ownerId.toString() === userId.toString();
  }

  /**
   * Verifica se o usuário é convidado da lista
   */
  isInvited(userId: Types.ObjectId, list: IList): boolean {
    return list.invites.some(
      (invite) => invite.userId.toString() === userId.toString()
    );
  }

  /**
   * Pega as permissões do usuário como convidado
   */
  getInvitePermissions(userId: Types.ObjectId, list: IList): string[] {
    const invite = list.invites.find(
      (inv) => inv.userId.toString() === userId.toString()
    );
    return invite?.permissions || [];
  }

  /**
   * Verifica se o usuário é Master ou Administrator
   */
  isPrivileged(user: IUser): boolean {
    return [GROUPS.MASTER, GROUPS.ADMINISTRATOR].includes(user.groupSlug);
  }

  /**
   * LÓGICA PRINCIPAL: Verifica se o usuário pode executar uma ação em uma lista
   */
  canPerformAction(
    user: IUser | null,
    list: IList,
    permission: string
  ): boolean {
    // Visitante (não logado)
    if (!user) {
      return this.canVisitorPerform(list, permission);
    }

    // Master e Administrator têm acesso total
    if (this.isPrivileged(user)) {
      return this.hasGroupPermission(user, permission);
    }

    // Dono sempre tem controle total
    if (this.isOwner(user._id, list)) {
      return this.hasGroupPermission(user, permission);
    }

    // Convidado
    if (this.isInvited(user._id, list)) {
      const invitePerms = this.getInvitePermissions(user._id, list);
      return invitePerms.includes(permission);
    }

    // Usuário comum - depende do tipo da lista
    return this.canUserPerformByListType(user, list, permission);
  }

  /**
   * Lógica para visitantes (não logados)
   */
  private canVisitorPerform(list: IList, permission: string): boolean {
    switch (list.type) {
      case "public":
        return permission === "lists.read";
      case "form":
        return permission === "rows.create";
      default:
        return false;
    }
  }

  /**
   * Lógica baseada no tipo da lista para usuários comuns
   */
  private canUserPerformByListType(
    user: IUser,
    list: IList,
    permission: string
  ): boolean {
    const hasGroupPerm = this.hasGroupPermission(user, permission);

    switch (list.type) {
      case "restricted":
        return false; // Só dono e convidados

      case "open":
        if (permission === "lists.read" || permission === "rows.create") {
          return hasGroupPerm;
        }
        return false; // Editar/deletar só dono e convidados

      case "public":
        if (permission === "lists.read") {
          return true; // Até visitante pode
        }
        if (permission === "rows.create") {
          return hasGroupPerm;
        }
        return false;

      case "form":
        if (permission === "rows.create") {
          return true; // Qualquer um pode criar
        }
        return false; // Só dono e convidados veem

      default:
        return false;
    }
  }

  /**
   * Verifica múltiplas permissões (AND)
   */
  hasAllPermissions(user: IUser, list: IList, permissions: string[]): boolean {
    return permissions.every((perm) => this.canPerformAction(user, list, perm));
  }

  /**
   * Verifica se tem pelo menos uma permissão (OR)
   */
  hasAnyPermission(user: IUser, list: IList, permissions: string[]): boolean {
    return permissions.some((perm) => this.canPerformAction(user, list, perm));
  }
}

export const permissionService = new PermissionService();
```

---

## 🔐 Middlewares de Autenticação

### 1. Authenticate Middleware

```typescript
// backend/src/modules/auth/middleware/authenticate.ts
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { User } from "../../users/user.model";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: any;
}

export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    // Pega o token do cookie
    const token = request.cookies.access_token;

    if (!token) {
      return reply.status(401).send({ error: "Token não fornecido" });
    }

    // Verifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // Busca o usuário
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: "Usuário não autorizado" });
    }

    // Adiciona o usuário na request
    request.user = user;
  } catch (error) {
    return reply.status(401).send({ error: "Token inválido" });
  }
}

export async function optionalAuthenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const token = request.cookies.access_token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        request.user = user;
      }
    }
  } catch (error) {
    // Ignora erros - usuário continua como visitante
  }
}
```

### 2. Authorize Middleware

```typescript
// backend/src/modules/auth/middleware/authorize.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "./authenticate";
import { permissionService } from "../../permissions/permission.service";
import { List } from "../../lists/list.model";

export function requirePermission(permission: string) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;
    const listId = request.params.listId || request.params.id;

    if (!user) {
      return reply.status(401).send({ error: "Autenticação necessária" });
    }

    // Se não for ação em lista específica, verifica só permissão do grupo
    if (!listId) {
      if (!permissionService.hasGroupPermission(user, permission)) {
        return reply.status(403).send({ error: "Sem permissão" });
      }
      return;
    }

    // Busca a lista
    const list = await List.findById(listId);

    if (!list) {
      return reply.status(404).send({ error: "Lista não encontrada" });
    }

    // Verifica permissão na lista
    if (!permissionService.canPerformAction(user, list, permission)) {
      return reply.status(403).send({ error: "Sem permissão para esta ação" });
    }
  };
}

export function requireRole(allowedRoles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Autenticação necessária" });
    }

    if (!allowedRoles.includes(user.groupSlug)) {
      return reply.status(403).send({ error: "Acesso negado" });
    }
  };
}
```

---

## 🛣️ Exemplo de Rotas

```typescript
// backend/src/modules/lists/list.routes.ts
import { FastifyInstance } from "fastify";
import {
  authenticate,
  optionalAuthenticate,
} from "../auth/middleware/authenticate";
import { requirePermission } from "../auth/middleware/authorize";
import { PERMISSIONS } from "../permissions/permission.constants";
import { listController } from "./list.controller";

export async function listRoutes(fastify: FastifyInstance) {
  // Criar lista
  fastify.post(
    "/lists",
    {
      preHandler: [authenticate, requirePermission(PERMISSIONS.LISTS_CREATE)],
    },
    listController.create
  );

  // Listar listas (autenticação opcional para públicas)
  fastify.get(
    "/lists",
    { preHandler: [optionalAuthenticate] },
    listController.list
  );

  // Ver lista específica
  fastify.get(
    "/lists/:id",
    {
      preHandler: [
        optionalAuthenticate,
        requirePermission(PERMISSIONS.LISTS_READ),
      ],
    },
    listController.getOne
  );

  // Atualizar lista
  fastify.put(
    "/lists/:id",
    {
      preHandler: [authenticate, requirePermission(PERMISSIONS.LISTS_UPDATE)],
    },
    listController.update
  );

  // Deletar lista
  fastify.delete(
    "/lists/:id",
    {
      preHandler: [authenticate, requirePermission(PERMISSIONS.LISTS_DELETE)],
    },
    listController.delete
  );

  // --- Rows ---

  // Criar row (pode ser visitante em formulário)
  fastify.post(
    "/lists/:listId/rows",
    {
      preHandler: [
        optionalAuthenticate,
        requirePermission(PERMISSIONS.ROWS_CREATE),
      ],
    },
    listController.createRow
  );

  // Listar rows
  fastify.get(
    "/lists/:listId/rows",
    {
      preHandler: [
        optionalAuthenticate,
        requirePermission(PERMISSIONS.ROWS_READ),
      ],
    },
    listController.listRows
  );
}
```

---

## ⚛️ Frontend - Context e Hooks

### 1. Auth Context

```typescript
// frontend/src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  groupSlug: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    setUser(response.data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.groupSlug === role;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, hasPermission, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```

### 2. Permission Hook

```typescript
// frontend/src/hooks/usePermission.ts
import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const { user, hasPermission, hasRole } = useAuth();

  const can = (permission: string, listContext?: any): boolean => {
    if (!user) return false;

    // Se for master ou admin, pode tudo
    if (["master", "administrator"].includes(user.groupSlug)) {
      return hasPermission(permission);
    }

    // Se for dono da lista
    if (listContext && listContext.ownerId === user.id) {
      return hasPermission(permission);
    }

    // Verifica convite
    if (listContext && listContext.invites) {
      const invite = listContext.invites.find(
        (inv: any) => inv.userId === user.id
      );
      if (invite?.permissions?.includes(permission)) {
        return true;
      }
    }

    // Verificação baseada no tipo da lista
    if (listContext) {
      return checkListTypePermission(user, listContext, permission);
    }

    return hasPermission(permission);
  };

  const checkListTypePermission = (
    user: any,
    list: any,
    permission: string
  ): boolean => {
    switch (list.type) {
      case "open":
        return (
          ["lists.read", "rows.create"].includes(permission) &&
          hasPermission(permission)
        );

      case "public":
        if (permission === "rows.create") {
          return hasPermission(permission);
        }
        return false;

      default:
        return false;
    }
  };

  return { can, hasRole };
}
```

### 3. Permission Guard Component

```typescript
// frontend/src/components/guards/PermissionGuard.tsx
import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PermissionGuardProps {
  permission: string;
  listContext?: any;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  listContext,
  fallback,
  children,
}: PermissionGuardProps) {
  const { can } = usePermission();

  if (!can(permission, listContext)) {
    return (
      fallback || (
        <Alert variant="destructive">
          <AlertDescription>
            Você não tem permissão para acessar este recurso.
          </AlertDescription>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}
```

### 4. Exemplo de Uso no React

```typescript
// frontend/src/pages/ListDetail.tsx
import { usePermission } from "@/hooks/usePermission";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Button } from "@/components/ui/button";

export function ListDetail() {
  const { can } = usePermission();
  const list = {
    /* dados da lista */
  };

  return (
    <div>
      <h1>{list.name}</h1>

      {/* Botão condicional */}
      {can("rows.create", list) && (
        <Button onClick={handleCreate}>Adicionar Registro</Button>
      )}

      {/* Seção protegida */}
      <PermissionGuard permission="fields.update" listContext={list}>
        <div>
          <h2>Gerenciar Campos</h2>
          {/* Conteúdo protegido */}
        </div>
      </PermissionGuard>

      {/* Com fallback customizado */}
      <PermissionGuard
        permission="rows.delete"
        listContext={list}
        fallback={<p>Apenas o dono pode deletar registros</p>}
      >
        <Button variant="destructive">Deletar</Button>
      </PermissionGuard>
    </div>
  );
}
```

---

## 🌱 Seed de Grupos

```typescript
// backend/src/modules/groups/group.seed.ts
import { Group } from "./group.model";
import {
  GROUP_PERMISSIONS,
  GROUPS,
  GROUP_LEVELS,
} from "../permissions/permission.constants";

export async function seedGroups() {
  const groups = [
    {
      name: "Master",
      slug: GROUPS.MASTER,
      permissions: GROUP_PERMISSIONS[GROUPS.MASTER],
      level: GROUP_LEVELS[GROUPS.MASTER],
    },
    {
      name: "Administrador",
      slug: GROUPS.ADMINISTRATOR,
      permissions: GROUP_PERMISSIONS[GROUPS.ADMINISTRATOR],
      level: GROUP_LEVELS[GROUPS.ADMINISTRATOR],
    },
    {
      name: "Gerente",
      slug: GROUPS.MANAGER,
      permissions: GROUP_PERMISSIONS[GROUPS.MANAGER],
      level: GROUP_LEVELS[GROUPS.MANAGER],
    },
    {
      name: "Registrado",
      slug: GROUPS.REGISTERED,
      permissions: GROUP_PERMISSIONS[GROUPS.REGISTERED],
      level: GROUP_LEVELS[GROUPS.REGISTERED],
    },
  ];

  for (const group of groups) {
    await Group.findOneAndUpdate({ slug: group.slug }, group, {
      upsert: true,
    });
  }

  console.log("✅ Grupos criados com sucesso!");
}
```

---

## 🍪 Configuração JWT + Cookies no Fastify

```typescript
// backend/src/modules/auth/auth.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../users/user.model";

export const authController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = request.body as any;

    const user = await User.findOne({ email });
    if (!user) {
      return reply.status(401).send({ error: "Credenciais inválidas" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.status(401).send({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    // Define cookie httpOnly
    reply.setCookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return reply.send({ user: userResponse });
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("access_token");
    return reply.send({ message: "Logout realizado" });
  },

  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    return reply.send(user);
  },
};
```

---
