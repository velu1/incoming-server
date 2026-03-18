import { initDB } from "../models";
const connectionCache: Record<string, any> = {};

export const getDB = (uri: string) => {
  if (typeof uri !== "string") {
    return Promise.reject(new Error("MongoDB URI must be a string."));
  }

  // Cache by URI to handle multiple tenants with same DB name
  if (connectionCache[uri]) {
    return Promise.resolve(connectionCache[uri]);
  }
  return initDB(uri).then((db) => {
    connectionCache[uri] = db;
    return db;
  });
};
