import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { DataSource, DataSourceOptions } from "typeorm";
import { required } from "./config";

export const createDatabase = (variable: string, entities: DataSourceOptions["entities"]) => {
  const database = path.resolve(required(variable));
  fs.mkdirSync(path.dirname(database), { recursive: true });
  return new DataSource({ type: "sqlite", database, entities, synchronize: true, logging: false, busyTimeout: 5000 });
};
