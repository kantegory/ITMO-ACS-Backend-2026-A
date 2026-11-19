import bcrypt from 'bcrypt';
const checkPassword = (hash: string, password: string): boolean => bcrypt.compareSync(password, hash);
export default checkPassword;
