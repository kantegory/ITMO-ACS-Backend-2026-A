import bcrypt from 'bcryptjs';
import { settings } from '../config/settings';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, settings.bcryptRounds);
}