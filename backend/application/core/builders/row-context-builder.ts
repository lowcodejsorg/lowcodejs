import type { IField } from '../entity.core';
import { E_FIELD_TYPE, E_REACTION_TYPE } from '../entity.core';

export function transformRowContext<T extends Record<string, any>>(
  rowJson: T,
  fields: IField[],
  userId?: string,
): T {
  const row = rowJson as Record<string, any>;

  for (const field of fields) {
    if (field.type === E_FIELD_TYPE.EVALUATION) {
      const evaluations = Array.isArray(row[field.slug]) ? row[field.slug] : [];

      const count = evaluations.length;

      let average = 0;
      if (count > 0) {
        const sum = evaluations.reduce(
          (acc: number, e: any) => acc + (e.value ?? 0),
          0,
        );
        average = sum / count;
      }

      let userValue: number | null = null;
      if (userId) {
        const userEval = evaluations.find(
          (e: any) => e.user?.toString() === userId,
        );
        if (userEval) {
          userValue = userEval.value;
        }
      }

      row[field.slug] = {
        _average: average,
        _count: count,
        _userValue: userValue,
      };
    }

    if (field.type === E_FIELD_TYPE.REACTION) {
      const reactions = Array.isArray(row[field.slug]) ? row[field.slug] : [];

      const likeCount = reactions.filter(
        (r: any) => r.type === E_REACTION_TYPE.LIKE,
      ).length;

      const unlikeCount = reactions.filter(
        (r: any) => r.type === E_REACTION_TYPE.UNLIKE,
      ).length;

      let userReaction: string | null = null;
      if (userId) {
        const userReact = reactions.find(
          (r: any) => r.user?.toString() === userId,
        );
        if (userReact) {
          userReaction = userReact.type;
        }
      }

      row[field.slug] = {
        _likeCount: likeCount,
        _unlikeCount: unlikeCount,
        _userReaction: userReaction,
      };
    }
  }

  return row as T;
}
