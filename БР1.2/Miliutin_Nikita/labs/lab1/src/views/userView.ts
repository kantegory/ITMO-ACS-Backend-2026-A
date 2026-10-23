import { User } from "../models/types";

export const userView = (user: User) => ({
  id: user.user_id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  created_at: user.created_at
});
