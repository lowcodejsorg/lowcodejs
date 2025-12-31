import mongoose from 'mongoose';

import { Env } from '@start/env';

import '@application/model/evaluation.model';
import '@application/model/field.model';
import '@application/model/permission.model';
import '@application/model/reaction.model';
import '@application/model/storage.model';
import '@application/model/table.model';
import '@application/model/user-group.model';
import '@application/model/user.model';
import '@application/model/validation-token.model';

export async function MongooseConnect(): Promise<void> {
  try {
    console.log(Env.DATABASE_URL);
    await mongoose.connect(Env.DATABASE_URL, {
      autoCreate: true,
      dbName: Env.DB_NAME,
    });
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
