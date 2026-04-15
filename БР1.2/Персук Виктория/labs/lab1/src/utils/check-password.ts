import bcrypt from 'bcryptjs';

const checkPassword = (userPassword: string, password: string) => {
    return bcrypt.compareSync(password, userPassword);
};

export default checkPassword;
