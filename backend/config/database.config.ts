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

let dataConnection: mongoose.Connection;

export function getDataConnection(): mongoose.Connection {
  if (!dataConnection) {
    throw new Error(
      'Data connection not initialized. Call MongooseConnect() first.',
    );
  }
  return dataConnection;
}

export function setDataConnection(conn: mongoose.Connection): void {
  dataConnection = conn;
}

export async function MongooseConnect(): Promise<void> {
  try {
    await mongoose.connect(Env.DATABASE_URL, {
      autoCreate: true,
      dbName: Env.DB_DATABASE,
    });

    dataConnection = mongoose.createConnection(Env.DATABASE_URL, {
      autoCreate: true,
      dbName: Env.DB_DATA_DATABASE,
    });
    await dataConnection.asPromise();
  } catch (error) {
    console.error(error);
    if (dataConnection) {
      await dataConnection.close();
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}
