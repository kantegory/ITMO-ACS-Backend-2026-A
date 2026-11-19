import { createDatabase } from "../shared/database";
import { Notification } from "./Notification";
export const AppDataSource = createDatabase("NOTIFICATIONS_DATABASE_PATH", [Notification]);
