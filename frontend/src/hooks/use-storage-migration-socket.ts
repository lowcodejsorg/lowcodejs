import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import type { StorageDriver } from './tanstack-query/use-storage-migration-status';

export const STORAGE_MIGRATION_NAMESPACE = '/storage-migration';

export const STORAGE_MIGRATION_EVENT = {
  PROGRESS: 'progress',
  FILE_MIGRATED: 'file_migrated',
  FILE_FAILED: 'file_failed',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type ProgressEvent = {
  job_id: string;
  processed: number;
  total: number;
  current_filename: string | null;
  failed_count: number;
  eta_seconds: number | null;
};

export type FileMigratedEvent = {
  _id: string;
  filename: string;
  from: StorageDriver;
  to: StorageDriver;
};

export type FileFailedEvent = {
  _id: string;
  filename: string;
  error: string;
  attempts: number;
};

export type CompletedEvent = {
  job_id: string;
  total: number;
  succeeded: number;
  failed: number;
  duration_ms: number;
};

export type ErrorEvent = {
  job_id: string;
  message: string;
};

export type StorageMigrationProgressState = {
  isConnected: boolean;
  progress: ProgressEvent | null;
  failures: Array<FileFailedEvent>;
  lastCompleted: CompletedEvent | null;
  lastError: ErrorEvent | null;
};

const INITIAL_STATE: StorageMigrationProgressState = {
  isConnected: false,
  progress: null,
  failures: [],
  lastCompleted: null,
  lastError: null,
};

export function useStorageMigrationSocket(
  baseUrl: string,
  enabled: boolean,
): StorageMigrationProgressState {
  const [state, setState] =
    useState<StorageMigrationProgressState>(INITIAL_STATE);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL_STATE);
      return;
    }

    const socket = io(`${baseUrl}${STORAGE_MIGRATION_NAMESPACE}`, {
      withCredentials: true,
      path: '/socket.io',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on(STORAGE_MIGRATION_EVENT.PROGRESS, (evt: ProgressEvent) => {
      setState((prev) => ({ ...prev, progress: evt }));
    });

    socket.on(STORAGE_MIGRATION_EVENT.FILE_FAILED, (evt: FileFailedEvent) => {
      setState((prev) => ({
        ...prev,
        failures: [...prev.failures, evt],
      }));
    });

    socket.on(STORAGE_MIGRATION_EVENT.COMPLETED, (evt: CompletedEvent) => {
      setState((prev) => ({ ...prev, lastCompleted: evt }));
    });

    socket.on(STORAGE_MIGRATION_EVENT.ERROR, (evt: ErrorEvent) => {
      setState((prev) => ({ ...prev, lastError: evt }));
    });

    return (): void => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [baseUrl, enabled]);

  return state;
}
