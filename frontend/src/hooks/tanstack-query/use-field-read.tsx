import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { fieldDetailOptions } from './_query-options';

import type { IField } from '@/lib/interfaces';

interface UseFieldReadParams {
  tableSlug: string;
  fieldId: string;
  groupSlug?: string;
}

export function useFieldRead(
  params: UseFieldReadParams,
): UseQueryResult<IField, Error> {
  return useQuery(
    fieldDetailOptions(params.tableSlug, params.fieldId, params.groupSlug),
  );
}
