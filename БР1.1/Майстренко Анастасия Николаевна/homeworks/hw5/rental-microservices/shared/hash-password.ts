import bcrypt from 'bcrypt';

export const hashPassword = (password: string): string =>
    bcrypt.hashSync(password, bcrypt.genSaltSync(8));

export const checkPassword = (userPassword: string, password: string): boolean =>
    bcrypt.compareSync(password, userPassword);
