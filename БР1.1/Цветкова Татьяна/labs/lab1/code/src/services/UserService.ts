import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { UpdateProfileDto } from "../dto/user.dto";
import { NotFoundError } from "../utils/AppError";

export class UserService {
  private repo = AppDataSource.getRepository(User);

  async getById(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.getById(id);
    Object.assign(user, {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : user.birthDate,
    });
    return this.repo.save(user);
  }

  async deleteAccount(id: string) {
    const result = await this.repo.delete({ id });
    if (!result.affected) throw new NotFoundError("User not found");
  }
}
