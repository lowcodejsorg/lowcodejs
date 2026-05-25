/**
 * Socket.IO namespace `/csv-import`.
 *
 * Real-time progress feed for CSV row import jobs. Authentication is verified
 * at handshake using the same access token cookie as the rest of the app —
 * only roles MASTER and ADMINISTRATOR are admitted.
 *
 * Rooms: each import job gets its own room `job:{jobId}`. Clients must emit
 * `join` with the jobId string immediately after connecting.
 *
 * Emitted events (server → client):
 *   - progress   { job_id, processed, total }
 *   - completed  { job_id, imported, skipped, total }
 *   - error      { job_id, message, cause }
 */
/* eslint-disable no-unused-vars */
import type { Namespace, Server } from 'socket.io';

import {
  E_JWT_TYPE,
  E_ROLE,
  type IJWTPayload,
} from '@application/core/entity.core';

export const CSV_IMPORT_NAMESPACE = '/csv-import';

export const CSV_IMPORT_EVENT = {
  PROGRESS: 'progress',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type CsvImportProgressEvent = {
  job_id: string;
  processed: number;
  total: number;
};

export type CsvImportCompletedEvent = {
  job_id: string;
  imported: number;
  skipped: number;
  total: number;
};

export type CsvImportErrorEvent = {
  job_id: string;
  message: string;
  cause: string;
};

function extractCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  let lastValue: string | undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      lastValue = rest.join('=');
    }
  }
  return lastValue;
}

export function initCsvImportSocket(
  io: Server,
  jwtDecode: (token: string) => IJWTPayload | null,
): Namespace {
  const namespace = io.of(CSV_IMPORT_NAMESPACE);

  namespace.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const accessToken = extractCookieValue(cookieHeader, 'accessToken');

    if (!accessToken) {
      next(new Error('Autenticação necessária.'));
      return;
    }

    const decoded = jwtDecode(accessToken);
    if (!decoded || decoded.type !== E_JWT_TYPE.ACCESS) {
      next(new Error('Token inválido.'));
      return;
    }

    if (decoded.role !== E_ROLE.MASTER && decoded.role !== E_ROLE.ADMINISTRATOR) {
      next(new Error('Acesso negado.'));
      return;
    }

    socket.data.user = decoded;
    next();
  });

  namespace.on('connection', (socket) => {
    socket.on('join', (jobId: string) => {
      socket.join('job:' + jobId);
    });

    socket.on('disconnect', () => {});
  });

  return namespace;
}
