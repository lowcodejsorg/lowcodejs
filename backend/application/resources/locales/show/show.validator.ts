import z from 'zod';

export const LocaleShowParamValidator = z.object({
  locale: z
    .string({ message: 'O locale é obrigatório' })
    .trim()
    .min(1, 'O locale é obrigatório')
    .regex(
      /^[a-z]{2}-[a-z]{2}$/,
      'O locale deve estar no formato idioma-país (ex: pt-br)',
    ),
});

export type LocaleShowPayload = z.infer<typeof LocaleShowParamValidator>;
