export const SETUP_STEPS = [
  'admin',
  'name',
  'storage',
  'logos',
  'upload',
  'paging',
  'email',
] as const;

export type SetupStep = (typeof SETUP_STEPS)[number];

const NEXT_STEP: Record<SetupStep, SetupStep | null> = {
  admin: 'name',
  name: 'storage',
  storage: 'logos',
  logos: 'upload',
  upload: 'paging',
  paging: 'email',
  email: null,
};

export function nextStep(step: SetupStep): SetupStep | null {
  return NEXT_STEP[step];
}
