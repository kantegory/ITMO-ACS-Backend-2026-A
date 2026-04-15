import jwt, { SignOptions } from 'jsonwebtoken';
import { User, UserRole } from '../entities/User.entity';

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'uqvwyervuywevyuewfvuyefwuvy1337';
  private static readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'asdbhjasdhjbsadhjasdnjkasd67';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

  static generateTokens(user: User): Tokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET as jwt.Secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    } as SignOptions);

    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET as jwt.Secret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    } as SignOptions);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static refreshTokens(refreshToken: string): Tokens {
    const payload = this.verifyRefreshToken(refreshToken);
    
    // Create new tokens with the same payload
    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET as jwt.Secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    } as SignOptions);

    const newRefreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET as jwt.Secret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    } as SignOptions);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }
}
