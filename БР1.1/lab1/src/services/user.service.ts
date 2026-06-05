import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User, UserRole, UserResponse } from '../entities/User.entity';
import { AppError } from '../middleware/error-handler';
import { JWTService, Tokens } from '../utils/jwt';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async register(
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<{ user: UserResponse; tokens: Tokens }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('EMAIL_EXISTS', 'Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      fullName,
      phone,
      password: hashedPassword,
      role: UserRole.GUEST,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = JWTService.generateTokens(user);

    return {
      user: user.toResponse(),
      tokens,
    };
  }

  async login(email: string, password: string): Promise<{ user: UserResponse; tokens: Tokens }> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const tokens = JWTService.generateTokens(user);

    return {
      user: user.toResponse(),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    return JWTService.refreshTokens(refreshToken);
  }

  async getProfile(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user.toResponse();
  }

  async updateProfile(
    userId: number,
    updates: {
      fullName?: string;
      phone?: string;
      password?: string;
    }
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Update fields if provided
    if (updates.fullName !== undefined) {
      user.fullName = updates.fullName;
    }
    
    if (updates.phone !== undefined) {
      user.phone = updates.phone;
    }
    
    if (updates.password !== undefined) {
      if (updates.password.length < 6) {
        throw new AppError('INVALID_PASSWORD', 'Password must be at least 6 characters', 400);
      }
      user.password = await bcrypt.hash(updates.password, 10);
    }

    await this.userRepository.save(user);

    return user.toResponse();
  }

  async updateUserRole(userId: number, role: UserRole, requesterId: number): Promise<UserResponse> {
    // Check if requester is admin
    const requester = await this.userRepository.findOne({ where: { id: requesterId } });
    if (!requester || requester.role !== UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Only admin can change user roles', 403);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Cannot change own role
    if (user.id === requesterId) {
      throw new AppError('SELF_ROLE_CHANGE', 'Cannot change your own role', 400);
    }

    user.role = role;
    await this.userRepository.save(user);

    return user.toResponse();
  }

  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return user;
  }

  async getAllUsers(
    filters?: {
      role?: UserRole;
      email?: string;
    }
  ): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters?.email) {
      query.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
    }

    query.orderBy('user.created_at', 'DESC');

    return await query.getMany();
  }

  async deleteUser(userId: number, requesterId: number): Promise<void> {
    // Check if requester is admin
    const requester = await this.userRepository.findOne({ where: { id: requesterId } });
    if (!requester || requester.role !== UserRole.ADMIN) {
      throw new AppError('FORBIDDEN', 'Only admin can delete users', 403);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Cannot delete yourself
    if (user.id === requesterId) {
      throw new AppError('SELF_DELETE', 'Cannot delete your own account', 400);
    }

    await this.userRepository.remove(user);
  }
}
