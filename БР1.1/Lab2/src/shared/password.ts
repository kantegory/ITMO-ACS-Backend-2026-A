import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = (password: string): string => bcrypt.hashSync(password, SALT_ROUNDS);

export const checkPassword = (passwordHash: string, password: string): boolean =>
    bcrypt.compareSync(password, passwordHash);
