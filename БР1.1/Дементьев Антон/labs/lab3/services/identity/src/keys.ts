import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Ключ подписи JWT (RS256). Хранится в файле (том Docker), чтобы токены переживали перезапуск.
const file = process.env.JWT_KEY_FILE;
let privateKey: crypto.KeyObject;
if (file && fs.existsSync(file)) {
    privateKey = crypto.createPrivateKey(fs.readFileSync(file));
} else {
    privateKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    if (file) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, privateKey.export({ type: 'pkcs8', format: 'pem' }) as string, { mode: 0o600 });
    }
}
const publicKey = crypto.createPublicKey(privateKey);
export const KID = crypto.createHash('sha256').update(publicKey.export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16);

export const jwks = () => ({ keys: [{ ...(publicKey.export({ format: 'jwk' }) as any), use: 'sig', alg: 'RS256', kid: KID }] });
export const sign = (payload: object, expiresInSeconds: number): string =>
    jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: KID, expiresIn: expiresInSeconds });
