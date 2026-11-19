import { createDatabase } from "../shared/database";
import { User } from "./entities";
export const AppDataSource = createDatabase("ACCOUNTS_DATABASE_PATH", [User]);
