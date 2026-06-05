import bcrypt from 'bcrypt';

const checkPassword = (hash: string, password: string): boolean => {
    return bcrypt.compareSync(password, hash);
};

export default checkPassword;
