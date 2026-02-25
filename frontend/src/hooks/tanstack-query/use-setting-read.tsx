import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { settingOptions } from './_query-options';

import type { ISetting } from '@/lib/interfaces';

export function useSettingRead(): UseQueryResult<ISetting> {
  return useQuery(settingOptions());
}
