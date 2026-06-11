/* eslint-disable no-unused-vars */
import type mongoose from 'mongoose';

import type {
  IField,
  IGroupConfiguration,
} from '@application/core/entity.core';

export abstract class PopulateBuilderContractService {
  abstract build(
    fields?: IField[],
    groups?: IGroupConfiguration[],
    conn?: mongoose.Connection,
    depth?: number,
  ): Promise<mongoose.PopulateOptions[]>;

  abstract getRelationships(fields?: IField[]): IField[];
}
