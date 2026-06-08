import bcrypt from 'bcrypt';

const checkPassword = (userPassword: string, password: string): boolean => {
    return bcrypt.compareSync(password, userPassword);
};

export default checkPassword;
