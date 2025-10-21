import z from 'zod';

export const AuthenticationSignInSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export const AuthenticationSignUpSchema = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  password: z.string().trim(),
});

export const AuthenticationMagicLinkSchema = z.object({
  code: z.string().trim(),
});

export const AuthenticationRecoveryUpdatePasswordSchema = z.object({
  password: z.string().trim().min(8),
});

export const AuthenticationRecoveryRequestCodeSchema = z.object({
  email: z.email().trim(),
});

export const AuthenticationRecoveryValidateCodeSchema = z.object({
  code: z.coerce.string().trim(),
});
