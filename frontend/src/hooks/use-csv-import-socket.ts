import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

const CSV_IMPORT_NAMESPACE = '/csv-import';

const CSV_IMPORT_EVENT = {
  PROGRESS: 'progress',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

type CsvImportProgressEvent = {
  job_id: string;
  processed: number;
  total: number;
};

type CsvImportCompletedEvent = {
  job_id: string;
  imported: number;
  skipped: number;
  total: number;
};

type CsvImportErrorEvent = {
  job_id: string;
  message: string;
  cause: string;
};

type CsvImportSocketState = {
  isConnected: boolean;
  progress: CsvImportProgressEvent | null;
  completed: CsvImportCompletedEvent | null;
  error: CsvImportErrorEvent | null;
};

const INITIAL_STATE: CsvImportSocketState = {
  isConnected: false,
  progress: null,
  completed: null,
  error: null,
};

export function useCsvImportSocket(
  baseUrl: string,
  jobId: string | null,
): CsvImportSocketState {
  const [state, setState] = useState<CsvImportSocketState>(INITIAL_STATE);
  const socketRef = useRef<Socket | null>(null);

  useEffect((): (() => void) => {
    if (jobId === null) {
      setState(INITIAL_STATE);
      return (): void => undefined;
    }

    const socket = io(`${baseUrl}${CSV_IMPORT_NAMESPACE}`, {
      withCredentials: true,
      path: '/socket.io',
    });

    socketRef.current = socket;

    socket.on('connect', (): void => {
      setState((prev) => ({ ...prev, isConnected: true }));
      socket.emit('join', jobId);
    });

    socket.on('disconnect', (): void => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on(
      CSV_IMPORT_EVENT.PROGRESS,
      (evt: CsvImportProgressEvent): void => {
        setState((prev) => ({ ...prev, progress: evt }));
      },
    );

    socket.on(
      CSV_IMPORT_EVENT.COMPLETED,
      (evt: CsvImportCompletedEvent): void => {
        setState((prev) => ({ ...prev, completed: evt }));
      },
    );

    socket.on(CSV_IMPORT_EVENT.ERROR, (evt: CsvImportErrorEvent): void => {
      setState((prev) => ({ ...prev, error: evt }));
    });

    return (): void => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [baseUrl, jobId]);

  return state;
}
