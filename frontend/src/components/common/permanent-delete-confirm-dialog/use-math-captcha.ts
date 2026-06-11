import React from 'react';

const operationFactory = {
  add: function (a: number, b: number): { symbol: string; result: number } {
    return { symbol: '+', result: a + b };
  },
  sub: function (a: number, b: number): { symbol: string; result: number } {
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return { symbol: '-', result: high - low };
  },
} as const;

type OperationKey = keyof typeof operationFactory;
const OPERATION_KEYS: Array<OperationKey> = ['add', 'sub'];

function pickInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOperation(): OperationKey {
  const index = Math.floor(Math.random() * OPERATION_KEYS.length);
  return OPERATION_KEYS[index];
}

function buildCaptcha(): { question: string; expected: number } {
  const a = pickInteger(1, 9);
  const b = pickInteger(1, 9);
  const key = pickOperation();
  const op = operationFactory[key];
  const high = Math.max(a, b);
  const low = Math.min(a, b);

  if (key === 'sub') {
    const result = op(high, low).result;
    return {
      question: 'Quanto é '.concat(String(high), ' - ', String(low), '?'),
      expected: result,
    };
  }

  const result = op(a, b).result;
  return {
    question: 'Quanto é '.concat(String(a), ' + ', String(b), '?'),
    expected: result,
  };
}

export type UseMathCaptchaResult = {
  question: string;
  expected: number;
  regenerate: () => void;
};

export function useMathCaptcha(): UseMathCaptchaResult {
  const [state, setState] = React.useState(buildCaptcha);

  const regenerate = React.useCallback(function (): void {
    setState(buildCaptcha());
  }, []);

  return {
    question: state.question,
    expected: state.expected,
    regenerate,
  };
}
