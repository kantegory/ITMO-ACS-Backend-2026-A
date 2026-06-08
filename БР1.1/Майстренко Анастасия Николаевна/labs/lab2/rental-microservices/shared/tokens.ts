import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'secret';
const ACCESS_TTL = parseInt(process.env.JWT_ACCESS_TOKEN_LIFETIME || '900');
const REFRESH_TTL = parseInt(process.env.JWT_REFRESH_TOKEN_LIFETIME || '1209600');

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export function issueTokens(user: { id: number; role?: string }): AuthTokens {
    const payload = { user: { id: user.id, role: user.role } };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, {
        expiresIn: REFRESH_TTL,
    });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: ACCESS_TTL };
}
