import { Repository } from 'typeorm';
import { User, UserRole } from '../user/user.entity';
import { AppDataSource } from '../../config/database';
import { hashPassword } from '../../utils/hash-password';
import { checkPassword } from '../../utils/check-password';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { RegisterDto, LoginDto, TokenPairResponse, UserResponse } from './auth.dto';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      is_verified: user.is_verified,
      created_at: user.created_at,
    };
  }

  private generateTokens(user: User): TokenPairResponse {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: generateAccessToken(payload),
      refresh_token: generateRefreshToken(payload),
      expires_in: 900, // 15 minutes in seconds
    };
  }

  async register(dto: RegisterDto): Promise<UserResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const hashedPassword = await hashPassword(dto.password);
    
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
      middle_name: dto.middle_name || null,
      role: UserRole.USER,
      is_verified: false, // Временно false, т.к. подтверждение почты не делаем
    });

    await this.userRepository.save(user);

    // TODO: Отправить email с подтверждением (заглушка)
    console.log(`[MOCK] Verification email sent to ${user.email}`);

    return this.toUserResponse(user);
  }

  async login(dto: LoginDto): Promise<{ user: UserResponse; tokens: TokenPairResponse }> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await checkPassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPairResponse> {
    const { verifyRefreshToken } = require('../../utils/jwt');
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find user to ensure they still exist
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    // В простой реализации JWT мы не храним токены,
    // поэтому logout просто говорит клиенту удалить токены.
    // Для полноценной инвалидации нужен черный список токенов в Redis.
    console.log(`[MOCK] Logout for token: ${refreshToken.substring(0, 20)}...`);
  }

  async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.toUserResponse(user);
  }
}