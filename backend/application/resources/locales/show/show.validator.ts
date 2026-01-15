import z from 'zod';

export const LocaleShowParamValidator = z.object({
  locale: z
    .string({ message: 'O locale é obrigatório' })
    .trim()
    .min(1, 'O locale é obrigatório'),
});

export type LocaleShowPayload = z.infer<typeof LocaleShowParamValidator>;
