import mongoose from "mongoose";

export const connectDBs = (mongodbURI: string) => {
  if (!mongodbURI) {
    return Promise.reject(new Error("MongoDB URI is required."));
  }

  // Create a new connection and return as a Promise
  return mongoose
    .createConnection(mongodbURI)
    .asPromise()
    .then((connection) => {
      return connection;
    });
};
