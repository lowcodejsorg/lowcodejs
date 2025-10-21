import { Env } from '@start/env';
import mongoose from 'mongoose';

import '@model/collection.model';
import '@model/evaluation.model';
import '@model/field.model';
import '@model/permission.model';
import '@model/reaction.model';
import '@model/storage.model';
import '@model/user-group.model';
import '@model/user.model';
import '@model/validation-token.model';

export async function MongooseConnect(): Promise<void> {
  try {
    await mongoose.connect(Env.DATABASE_URL, {
      autoCreate: true,
      dbName: 'lowcodejs',
    });
  } catch (error) {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
