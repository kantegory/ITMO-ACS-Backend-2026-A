import bcrypt from 'bcrypt';

const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

export default hashPassword;
