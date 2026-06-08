import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { AppDataSource } from '../../config/database';
import { hashPassword } from '../../utils/hash-password';
import { checkPassword } from '../../utils/check-password';
import { generateAccessToken, generateRefreshToken, JwtPayload, verifyRefreshToken } from '../../utils/jwt';
import { RegisterDto, LoginDto, TokenPairResponse, UserResponse } from './auth.dto';
import { publishUserRegistered, publishUserRoleUpdated } from '../../events/user.publisher';


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
      expires_in: 900,
    };
  }

  async register(dto: RegisterDto): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(dto.password);
    
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
      middle_name: dto.middle_name || null,
      role: UserRole.USER,
      is_verified: false,
    });

    await this.userRepository.save(user);

    await publishUserRegistered(this.toUserResponse(user));

    console.log(`[MOCK] Verification email sent to ${user.email}`);

    return this.toUserResponse(user);
  }

  async login(dto: LoginDto): Promise<{ user: UserResponse; tokens: TokenPairResponse }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await checkPassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens(user);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPairResponse> {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
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

  // Внутренние методы для других сервисов
  async getUserById(id: number): Promise<UserResponse> {
    return this.getCurrentUser(id);
  }

  async updateProfile(userId: number, data: { first_name?: string; last_name?: string; middle_name?: string | null }): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (data.first_name !== undefined) user.first_name = data.first_name;
    if (data.last_name !== undefined) user.last_name = data.last_name;
    if (data.middle_name !== undefined) user.middle_name = data.middle_name;

    await this.userRepository.save(user);
    return this.toUserResponse(user);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await checkPassword(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    user.password = await hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  async validateToken(token: string): Promise<{ userId: number; role: string }> {
    const { verifyAccessToken } = require('../../utils/jwt');
    const payload = verifyAccessToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }
    return { userId: payload.userId, role: payload.role };
  }
}