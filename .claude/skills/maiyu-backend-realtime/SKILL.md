---
name: maiyu:backend-realtime
description: |
  Generates real-time communication modules for backend Node.js projects.
  Use when: user asks to create websocket, socket.io, real-time, chat, live updates,
  notifications, or mentions "realtime" for bi-directional communication.
  Supports: Socket.IO, native WebSocket, SSE (Server-Sent Events).
  Frameworks: Fastify, Express, NestJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Socket library**: `socket.io` | `ws` | `@fastify/websocket` | `@nestjs/websockets` | `@nestjs/platform-socket.io`
   - **Auth**: `jsonwebtoken` | `jose` | `@fastify/jwt` | `@fastify/cookie`
   - **Validator**: `zod` | `class-validator` | `@sinclair/typebox`
3. Scan existing socket/realtime files to detect:
   - Socket file location (e.g., `application/sockets/`, `src/gateways/`, `src/sockets/`)
   - Existing event naming conventions
   - Auth strategy already in use (cookie, JWT header)
   - Namespace or room patterns already established
4. If socket library not detected, ask user:
   ```
   Which real-time library do you want to use?
   1. Socket.IO (recommended — auto-reconnect, rooms, namespaces, fallback transport)
   2. Native WebSocket via ws (lightweight, no overhead)
   3. @fastify/websocket (Fastify-native WebSocket)
   4. SSE — Server-Sent Events (one-way server→client only)
   ```

## Conventions

### Naming
- File: `{feature}.socket.ts` (e.g., `chat.socket.ts`, `notification.socket.ts`)
- Events file: `{feature}.events.ts` (typed event definitions)
- Namespace: `/{feature}` (e.g., `/chat`, `/notifications`)
- Export: named functions only — `export function register{Feature}Socket(io: Server)` or `export function {feature}SocketHandler(socket: Socket)`

### File Placement
- `application/sockets/{feature}.socket.ts` (Fastify reference)
- `application/sockets/{feature}.events.ts` (Fastify reference)
- `src/gateways/{feature}.gateway.ts` (NestJS)
- `src/sockets/` (Express)

### Rules
- Always define typed event interfaces — never use `any` for event data
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- No ternary operators — use if/else or early returns
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Authenticate during handshake (connection middleware), not per-message
- Configure CORS explicitly — never use `origin: '*'` in production
- Sanitize all user-provided content (messages, filenames) before broadcasting
- Use rooms for scoped broadcasting — avoid broadcasting to all connections
- Handle disconnect and error events — always clean up resources
- Named exports only — no default exports

## Templates

### Socket.IO Server Setup (Fastify Reference)

**Typed Events — `sockets/{feature}.events.ts`:**
```typescript
export interface ServerToClientEvents {
  '{feature}:created': (data: {Entity}CreatedPayload) => void;
  '{feature}:updated': (data: {Entity}UpdatedPayload) => void;
  '{feature}:deleted': (data: {Entity}DeletedPayload) => void;
  '{feature}:error': (data: SocketErrorPayload) => void;
}

export interface ClientToServerEvents {
  '{feature}:subscribe': (data: SubscribePayload, callback: (ack: AckPayload) => void) => void;
  '{feature}:unsubscribe': (data: UnsubscribePayload) => void;
  '{feature}:create': (data: Create{Entity}Payload, callback: (ack: AckPayload) => void) => void;
  '{feature}:update': (data: Update{Entity}Payload, callback: (ack: AckPayload) => void) => void;
  '{feature}:delete': (data: Delete{Entity}Payload, callback: (ack: AckPayload) => void) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  email: string;
  role: string;
}

export interface {Entity}CreatedPayload {
  {entity}Id: string;
  data: Record<string, unknown>;
  createdBy: string;
  timestamp: string;
}

export interface {Entity}UpdatedPayload {
  {entity}Id: string;
  changes: Record<string, unknown>;
  updatedBy: string;
  timestamp: string;
}

export interface {Entity}DeletedPayload {
  {entity}Id: string;
  deletedBy: string;
  timestamp: string;
}

export interface SubscribePayload {
  room: string;
}

export interface UnsubscribePayload {
  room: string;
}

export interface Create{Entity}Payload {
  data: Record<string, unknown>;
}

export interface Update{Entity}Payload {
  {entity}Id: string;
  changes: Record<string, unknown>;
}

export interface Delete{Entity}Payload {
  {entity}Id: string;
}

export interface AckPayload {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}
```

**Server Setup — `sockets/socket.server.ts`:**
```typescript
import { Server } from 'socket.io';
import type { FastifyInstance } from 'fastify';

import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './{feature}.events';

interface SocketServerOptions {
  allowedOrigins: string[];
  cookieSecret?: string;
}

export function createSocketServer(
  fastify: FastifyInstance,
  options: SocketServerOptions,
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(fastify.server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const isAllowed = options.allowedOrigins.includes(origin);

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(authenticationMiddleware(fastify));

  io.on('connection', (socket) => {
    fastify.log.info(
      { socketId: socket.id, userId: socket.data.userId },
      'Client connected',
    );

    socket.join(`user:${socket.data.userId}`);

    socket.on('disconnect', (reason) => {
      fastify.log.info(
        { socketId: socket.id, userId: socket.data.userId, reason },
        'Client disconnected',
      );
    });

    socket.on('error', (error) => {
      fastify.log.error(
        { socketId: socket.id, error: error.message },
        'Socket error',
      );
    });
  });

  return io;
}

function authenticationMiddleware(fastify: FastifyInstance) {
  return async function (
    socket: {
      handshake: { headers: { cookie?: string }; auth?: { token?: string } };
      data: SocketData;
    },
    next: (err?: Error) => void,
  ): Promise<void> {
    try {
      let token: string | undefined;

      // Try auth object first (recommended for Socket.IO clients)
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // Fallback: extract from cookie header
      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const decoded = await fastify.jwt.decode(token);

      if (!decoded || typeof decoded !== 'object') {
        next(new Error('Invalid token'));
        return;
      }

      if (!isValidTokenPayload(decoded)) {
        next(new Error('Invalid token payload'));
        return;
      }

      socket.data.userId = decoded.sub;
      socket.data.email = decoded.email;
      socket.data.role = decoded.role;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  };
}

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

function isValidTokenPayload(decoded: unknown): decoded is TokenPayload {
  if (typeof decoded !== 'object' || decoded === null) {
    return false;
  }
  const obj = decoded as Record<string, unknown>;
  if (typeof obj.sub !== 'string') {
    return false;
  }
  if (typeof obj.email !== 'string') {
    return false;
  }
  if (typeof obj.role !== 'string') {
    return false;
  }
  return true;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const index = pair.indexOf('=');

    if (index === -1) {
      continue;
    }

    const key = pair.substring(0, index).trim();
    const value = pair.substring(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}
```

**Fastify Plugin Registration — `plugins/socket.plugin.ts`:**
```typescript
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { createSocketServer } from '../sockets/socket.server';
import { registerChatSocket } from '../sockets/chat.socket';
import { registerNotificationSocket } from '../sockets/notification.socket';

async function socketPlugin(fastify: FastifyInstance): Promise<void> {
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  const io = createSocketServer(fastify, { allowedOrigins });

  // Register feature-specific socket handlers
  registerChatSocket(io);
  registerNotificationSocket(io);

  // Decorate Fastify instance so other modules can emit events
  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    io.close();
  });
}

export default fp(socketPlugin, {
  name: 'socket-plugin',
  fastify: '5.x',
});
```

### Chat Module Template

**Chat Socket — `sockets/chat.socket.ts`:**
```typescript
import type { Server, Socket } from 'socket.io';
import DOMPurify from 'isomorphic-dompurify';

import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './chat.events';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface ChatMessagePayload {
  roomId: string;
  content: string;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  filename: string;
  mimeType: string;
  base64: string;
}

export interface ChatMessage {
  messageId: string;
  roomId: string;
  content: string;
  senderId: string;
  senderEmail: string;
  attachments: ChatAttachment[];
  timestamp: string;
}

interface ChatServerToClientEvents {
  'chat:message': (data: ChatMessage) => void;
  'chat:typing_start': (data: { roomId: string; userId: string; email: string }) => void;
  'chat:typing_stop': (data: { roomId: string; userId: string }) => void;
  'chat:user_joined': (data: { roomId: string; userId: string; email: string }) => void;
  'chat:user_left': (data: { roomId: string; userId: string }) => void;
  'chat:history': (data: { roomId: string; messages: ChatMessage[]; hasMore: boolean }) => void;
  'chat:error': (data: { code: string; message: string }) => void;
}

interface ChatClientToServerEvents {
  'chat:join_room': (data: { roomId: string }, callback: (ack: { success: boolean; message?: string }) => void) => void;
  'chat:leave_room': (data: { roomId: string }) => void;
  'chat:send_message': (data: ChatMessagePayload, callback: (ack: { success: boolean; messageId?: string }) => void) => void;
  'chat:typing_start': (data: { roomId: string }) => void;
  'chat:typing_stop': (data: { roomId: string }) => void;
  'chat:load_history': (data: { roomId: string; before?: string; limit?: number }, callback: (ack: { success: boolean; messages?: ChatMessage[]; hasMore?: boolean }) => void) => void;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function registerChatSocket(io: TypedServer): void {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket: TypedSocket) => {
    handleJoinRoom(socket);
    handleLeaveRoom(socket);
    handleSendMessage(socket, chatNamespace);
    handleTypingStart(socket);
    handleTypingStop(socket);
    handleLoadHistory(socket);
    handleDisconnect(socket);
  });
}

function handleJoinRoom(socket: TypedSocket): void {
  socket.on('chat:join_room', async (data: { roomId: string }, callback: (ack: { success: boolean; message?: string }) => void) => {
    const { roomId } = data;

    if (!roomId || typeof roomId !== 'string') {
      callback({ success: false, message: 'Invalid room ID' });
      return;
    }

    const sanitizedRoomId = DOMPurify.sanitize(roomId);
    await socket.join(`chat:${sanitizedRoomId}`);

    socket.to(`chat:${sanitizedRoomId}`).emit('chat:user_joined', {
      roomId: sanitizedRoomId,
      userId: socket.data.userId,
      email: socket.data.email,
    });

    callback({ success: true });
  });
}

function handleLeaveRoom(socket: TypedSocket): void {
  socket.on('chat:leave_room', async (data: { roomId: string }) => {
    const { roomId } = data;

    if (!roomId || typeof roomId !== 'string') {
      return;
    }

    const sanitizedRoomId = DOMPurify.sanitize(roomId);
    await socket.leave(`chat:${sanitizedRoomId}`);

    socket.to(`chat:${sanitizedRoomId}`).emit('chat:user_left', {
      roomId: sanitizedRoomId,
      userId: socket.data.userId,
    });
  });
}

function handleSendMessage(socket: TypedSocket, namespace: ReturnType<TypedServer['of']>): void {
  socket.on('chat:send_message', async (
    data: ChatMessagePayload,
    callback: (ack: { success: boolean; messageId?: string }) => void,
  ) => {
    const { roomId, content, attachments } = data;

    if (!roomId || !content || typeof content !== 'string') {
      callback({ success: false });
      return;
    }

    const sanitizedContent = DOMPurify.sanitize(content.trim());

    if (sanitizedContent.length === 0) {
      callback({ success: false });
      return;
    }

    // Validate attachments if present
    const validAttachments: ChatAttachment[] = [];

    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        if (!ALLOWED_MIME_TYPES.includes(attachment.mimeType)) {
          callback({ success: false });
          return;
        }

        const sizeInBytes = Math.ceil((attachment.base64.length * 3) / 4);

        if (sizeInBytes > MAX_ATTACHMENT_SIZE_BYTES) {
          callback({ success: false });
          return;
        }

        validAttachments.push({
          filename: DOMPurify.sanitize(attachment.filename),
          mimeType: attachment.mimeType,
          base64: attachment.base64,
        });
      }
    }

    const messageId = generateMessageId();
    const message: ChatMessage = {
      messageId,
      roomId,
      content: sanitizedContent,
      senderId: socket.data.userId,
      senderEmail: socket.data.email,
      attachments: validAttachments,
      timestamp: new Date().toISOString(),
    };

    // Persist message here (e.g., save to database)
    // await messageRepository.create(message);

    // Broadcast to room (including sender)
    namespace.to(`chat:${roomId}`).emit('chat:message', message);

    callback({ success: true, messageId });
  });
}

function handleTypingStart(socket: TypedSocket): void {
  socket.on('chat:typing_start', (data: { roomId: string }) => {
    if (!data.roomId) return;

    socket.to(`chat:${data.roomId}`).emit('chat:typing_start', {
      roomId: data.roomId,
      userId: socket.data.userId,
      email: socket.data.email,
    });
  });
}

function handleTypingStop(socket: TypedSocket): void {
  socket.on('chat:typing_stop', (data: { roomId: string }) => {
    if (!data.roomId) return;

    socket.to(`chat:${data.roomId}`).emit('chat:typing_stop', {
      roomId: data.roomId,
      userId: socket.data.userId,
    });
  });
}

function handleLoadHistory(socket: TypedSocket): void {
  socket.on('chat:load_history', async (
    data: { roomId: string; before?: string; limit?: number },
    callback: (ack: { success: boolean; messages?: ChatMessage[]; hasMore?: boolean }) => void,
  ) => {
    const { roomId, before } = data;

    if (!roomId) {
      callback({ success: false });
      return;
    }

    let limit = data.limit || 50;
    if (limit > 100) {
      limit = 100;
    }

    try {
      // Replace with your actual database query
      // const messages = await messageRepository.findByRoom(roomId, { before, limit: limit + 1 });
      const messages: ChatMessage[] = []; // placeholder
      const hasMore = messages.length > limit;

      if (hasMore) {
        messages.pop();
      }

      callback({ success: true, messages, hasMore });
    } catch (error) {
      callback({ success: false });
    }
  });
}

function handleDisconnect(socket: TypedSocket): void {
  socket.on('disconnect', () => {
    // Clean up typing indicators, presence, etc.
    // e.g., remove user from active typing sets
  });
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
```

### Live Entity Updates Template

**Entity Socket — `sockets/{entity}.socket.ts`:**
```typescript
import type { Server, Socket } from 'socket.io';

import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  {Entity}CreatedPayload,
  {Entity}UpdatedPayload,
  {Entity}DeletedPayload,
  AckPayload,
} from './{feature}.events';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Register live {entity} update handlers.
 * Clients subscribe to a room per resource (e.g., `{entity}:abc123`)
 * and receive real-time create/update/delete broadcasts.
 */
export function register{Entity}Socket(io: TypedServer): void {
  const namespace = io.of('/{feature}');

  namespace.on('connection', (socket: TypedSocket) => {
    handleSubscribe(socket);
    handleUnsubscribe(socket);
    handleDisconnect(socket);
  });
}

function handleSubscribe(socket: TypedSocket): void {
  socket.on('{feature}:subscribe', async (
    data: { room: string },
    callback: (ack: AckPayload) => void,
  ) => {
    const { room } = data;

    if (!room || typeof room !== 'string') {
      callback({ success: false, message: 'Invalid room identifier' });
      return;
    }

    await socket.join(`{feature}:${room}`);

    callback({ success: true, message: `Subscribed to {feature}:${room}` });
  });
}

function handleUnsubscribe(socket: TypedSocket): void {
  socket.on('{feature}:unsubscribe', async (data: { room: string }) => {
    if (!data.room) return;
    await socket.leave(`{feature}:${data.room}`);
  });
}

function handleDisconnect(socket: TypedSocket): void {
  socket.on('disconnect', () => {
    // Socket.IO automatically removes the socket from all rooms on disconnect
  });
}

/**
 * Emit a {entity} created event to all subscribers of the resource room.
 * Call this from your use-case or service layer after persisting the entity.
 *
 * @param io - The Socket.IO server instance
 * @param room - The room identifier (e.g., a parent resource ID)
 * @param payload - The created entity data
 * @param excludeSocketId - Optional socket ID to exclude (the originator)
 */
export function emit{Entity}Created(
  io: TypedServer,
  room: string,
  payload: {Entity}CreatedPayload,
  excludeSocketId?: string,
): void {
  const namespace = io.of('/{feature}');
  const target = `{feature}:${room}`;

  if (excludeSocketId) {
    namespace.to(target).except(excludeSocketId).emit('{feature}:created', payload);
  } else {
    namespace.to(target).emit('{feature}:created', payload);
  }
}

/**
 * Emit a {entity} updated event to all subscribers of the resource room.
 * Optionally excludes the originator socket so they don't receive their own update.
 */
export function emit{Entity}Updated(
  io: TypedServer,
  room: string,
  payload: {Entity}UpdatedPayload,
  excludeSocketId?: string,
): void {
  const namespace = io.of('/{feature}');
  const target = `{feature}:${room}`;

  if (excludeSocketId) {
    namespace.to(target).except(excludeSocketId).emit('{feature}:updated', payload);
  } else {
    namespace.to(target).emit('{feature}:updated', payload);
  }
}

/**
 * Emit a {entity} deleted event to all subscribers of the resource room.
 */
export function emit{Entity}Deleted(
  io: TypedServer,
  room: string,
  payload: {Entity}DeletedPayload,
  excludeSocketId?: string,
): void {
  const namespace = io.of('/{feature}');
  const target = `{feature}:${room}`;

  if (excludeSocketId) {
    namespace.to(target).except(excludeSocketId).emit('{feature}:deleted', payload);
  } else {
    namespace.to(target).emit('{feature}:deleted', payload);
  }
}
```

**Usage from a Use Case / Service:**
```typescript
import { emit{Entity}Created } from '@application/sockets/{entity}.socket';

// After persisting the new entity:
emit{Entity}Created(fastify.io, parentResourceId, {
  {entity}Id: created{Entity}._id.toString(),
  data: created{Entity},
  createdBy: request.user.sub,
  timestamp: new Date().toISOString(),
}, request.headers['x-socket-id'] as string | undefined);
```

### Notification Module Template

**Notification Socket — `sockets/notification.socket.ts`:**
```typescript
import type { Server, Socket } from 'socket.io';
import DOMPurify from 'isomorphic-dompurify';

import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './{feature}.events';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface NotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export function registerNotificationSocket(io: TypedServer): void {
  const namespace = io.of('/notifications');

  namespace.on('connection', (socket: TypedSocket) => {
    // Each user automatically joins their personal notification room
    socket.join(`notifications:user:${socket.data.userId}`);

    socket.on('disconnect', () => {
      // Automatic room cleanup by Socket.IO
    });
  });
}

/**
 * Send a notification to a specific user.
 */
export function notifyUser(
  io: TypedServer,
  userId: string,
  payload: NotificationPayload,
): void {
  const namespace = io.of('/notifications');
  const sanitizedPayload: NotificationPayload = {
    ...payload,
    title: DOMPurify.sanitize(payload.title),
    body: DOMPurify.sanitize(payload.body),
  };

  namespace.to(`notifications:user:${userId}`).emit('{feature}:created', sanitizedPayload);
}

/**
 * Send a notification to multiple specific users.
 */
export function notifyUsers(
  io: TypedServer,
  userIds: string[],
  payload: NotificationPayload,
): void {
  for (const userId of userIds) {
    notifyUser(io, userId, payload);
  }
}

/**
 * Broadcast a notification to all connected users.
 */
export function notifyAll(
  io: TypedServer,
  payload: NotificationPayload,
): void {
  const namespace = io.of('/notifications');
  const sanitizedPayload: NotificationPayload = {
    ...payload,
    title: DOMPurify.sanitize(payload.title),
    body: DOMPurify.sanitize(payload.body),
  };

  namespace.emit('{feature}:created', sanitizedPayload);
}

/**
 * Send a notification to all users in a specific room (e.g., a group or team).
 */
export function notifyRoom(
  io: TypedServer,
  room: string,
  payload: NotificationPayload,
): void {
  const namespace = io.of('/notifications');
  const sanitizedPayload: NotificationPayload = {
    ...payload,
    title: DOMPurify.sanitize(payload.title),
    body: DOMPurify.sanitize(payload.body),
  };

  namespace.to(room).emit('{feature}:created', sanitizedPayload);
}
```

### Express Alternative

**Socket.IO with Express — `sockets/socket.server.ts`:**
```typescript
import { createServer } from 'node:http';
import type { Express } from 'express';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './{feature}.events';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface SocketServerOptions {
  allowedOrigins: string[];
}

export function createExpressSocketServer(
  app: Express,
  options: SocketServerOptions,
): { httpServer: ReturnType<typeof createServer>; io: TypedServer } {
  const httpServer = createServer(app);

  const io: TypedServer = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const isAllowed = options.allowedOrigins.includes(origin);

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      let token: string | undefined;

      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      if (!isValidTokenPayload(decoded)) {
        next(new Error('Invalid token payload'));
        return;
      }

      socket.data.userId = decoded.sub;
      socket.data.email = decoded.email;
      socket.data.role = decoded.role;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} (user: ${socket.data.userId})`);

    socket.join(`user:${socket.data.userId}`);

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  return { httpServer, io };
}

// Reuse the same isValidTokenPayload type guard from the Fastify example above

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const index = pair.indexOf('=');

    if (index === -1) {
      continue;
    }

    const key = pair.substring(0, index).trim();
    const value = pair.substring(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}
```

**Express Usage — `app.ts`:**
```typescript
import express from 'express';
import { createExpressSocketServer } from './sockets/socket.server';
import { registerChatSocket } from './sockets/chat.socket';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const { httpServer, io } = createExpressSocketServer(app, { allowedOrigins });

registerChatSocket(io);

httpServer.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

### NestJS Alternative (Gateway Pattern)

**Chat Gateway — `gateways/chat.gateway.ts`:**
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import DOMPurify from 'isomorphic-dompurify';

import { WsAuthGuard } from '../guards/ws-auth.guard';

interface ChatMessage {
  messageId: string;
  roomId: string;
  content: string;
  senderId: string;
  senderEmail: string;
  timestamp: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticateClient(client);

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = user.sub;
      client.data.email = user.email;
      client.join(`user:${user.sub}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    // Cleanup resources if needed
  }

  @SubscribeMessage('chat:join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<{ success: boolean }> {
    if (!data.roomId || typeof data.roomId !== 'string') {
      throw new WsException('Invalid room ID');
    }

    const sanitizedRoomId = DOMPurify.sanitize(data.roomId);
    await client.join(`chat:${sanitizedRoomId}`);

    client.to(`chat:${sanitizedRoomId}`).emit('chat:user_joined', {
      roomId: sanitizedRoomId,
      userId: client.data.userId,
      email: client.data.email,
    });

    return { success: true };
  }

  @SubscribeMessage('chat:send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ): Promise<{ success: boolean; messageId: string }> {
    if (!data.roomId || !data.content) {
      throw new WsException('Room ID and content are required');
    }

    const sanitizedContent = DOMPurify.sanitize(data.content.trim());

    if (sanitizedContent.length === 0) {
      throw new WsException('Message content cannot be empty');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const message: ChatMessage = {
      messageId,
      roomId: data.roomId,
      content: sanitizedContent,
      senderId: client.data.userId,
      senderEmail: client.data.email,
      timestamp: new Date().toISOString(),
    };

    // Persist message (inject repository via constructor)
    // await this.messageRepository.create(message);

    this.server.to(`chat:${data.roomId}`).emit('chat:message', message);

    return { success: true, messageId };
  }

  @SubscribeMessage('chat:typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    if (!data.roomId) return;

    client.to(`chat:${data.roomId}`).emit('chat:typing_start', {
      roomId: data.roomId,
      userId: client.data.userId,
      email: client.data.email,
    });
  }

  @SubscribeMessage('chat:typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    if (!data.roomId) return;

    client.to(`chat:${data.roomId}`).emit('chat:typing_stop', {
      roomId: data.roomId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('chat:leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    if (!data.roomId) return;

    const sanitizedRoomId = DOMPurify.sanitize(data.roomId);
    await client.leave(`chat:${sanitizedRoomId}`);

    client.to(`chat:${sanitizedRoomId}`).emit('chat:user_left', {
      roomId: sanitizedRoomId,
      userId: client.data.userId,
    });
  }

  private async authenticateClient(
    client: Socket,
  ): Promise<{ sub: string; email: string } | null> {
    let token: string | undefined;

    if (client.handshake.auth && client.handshake.auth.token) {
      token = client.handshake.auth.token;
    }

    if (!token && client.handshake.headers.cookie) {
      const cookies = this.parseCookies(client.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      return null;
    }

    // Replace with your JwtService.verify() call
    // const decoded = await this.jwtService.verify(token);
    // return decoded;
    return null;
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    const pairs = cookieHeader.split(';');

    for (const pair of pairs) {
      const index = pair.indexOf('=');

      if (index === -1) {
        continue;
      }

      const key = pair.substring(0, index).trim();
      const value = pair.substring(index + 1).trim();
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }
}
```

**NestJS WebSocket Auth Guard — `guards/ws-auth.guard.ts`:**
```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    let token: string | undefined;

    if (client.handshake.auth && client.handshake.auth.token) {
      token = client.handshake.auth.token;
    }

    if (!token) {
      throw new WsException('Authentication required');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      client.data.userId = decoded.sub;
      client.data.email = decoded.email;
      client.data.role = decoded.role;
      return true;
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }
}
```

**NestJS Module Registration — `chat/chat.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChatGateway } from '../gateways/chat.gateway';
import { WsAuthGuard } from '../guards/ws-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [ChatGateway, WsAuthGuard],
})
export class ChatModule {}
```

## Checklist

- [ ] Typed event interfaces defined (`ServerToClientEvents`, `ClientToServerEvents`, `SocketData`)
- [ ] Socket.IO server created and attached to HTTP server
- [ ] CORS configured with explicit allowed origins (no wildcard in production)
- [ ] Authentication middleware on handshake (cookie or auth object)
- [ ] Connection and disconnect handlers with logging
- [ ] Room management (join, leave, auto-cleanup on disconnect)
- [ ] User content sanitized with DOMPurify before broadcasting
- [ ] Selective broadcasting with `except()` to skip originator
- [ ] Acknowledgment callbacks on client-to-server events
- [ ] File/attachment validation (MIME type, size limit)
- [ ] Typing indicators (start/stop) for chat features
- [ ] Message history with pagination support
- [ ] Notification helpers: `notifyUser`, `notifyUsers`, `notifyAll`, `notifyRoom`
- [ ] Fastify plugin with `onClose` hook to shut down Socket.IO gracefully
- [ ] No ternary operators — if/else used throughout
- [ ] Named exports only — no default exports (except Fastify plugin via `fp()`)
- [ ] No `any` types for event data — all payloads typed
