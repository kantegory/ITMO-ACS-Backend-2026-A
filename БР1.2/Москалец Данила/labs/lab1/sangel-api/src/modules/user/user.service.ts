import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AppDataSource } from '../../config/database';
import { checkPassword } from '../../utils/check-password';
import { hashPassword } from '../../utils/hash-password';
import { UpdateProfileDto, ChangePasswordDto } from './user.dto';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    if (dto.first_name !== undefined) {
      user.first_name = dto.first_name;
    }
    if (dto.last_name !== undefined) {
      user.last_name = dto.last_name;
    }
    if (dto.middle_name !== undefined) {
      user.middle_name = dto.middle_name;
    }

    await this.userRepository.save(user);
    return user;
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check old password
    const isPasswordValid = await checkPassword(dto.old_password, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and save new password
    user.password = await hashPassword(dto.new_password);
    await this.userRepository.save(user);
  }

  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}