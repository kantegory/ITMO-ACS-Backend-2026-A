import bcrypt from 'bcrypt';

const checkPassword = (userPassword: string, password: string) => {
    return bcrypt.compareSync(password, userPassword);
};

export default checkPassword;
