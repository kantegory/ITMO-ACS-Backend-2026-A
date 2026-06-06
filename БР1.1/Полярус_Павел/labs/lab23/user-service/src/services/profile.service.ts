import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { JobSeeker } from '../entities/JobSeeker';
import { Employer } from '../entities/Employer';
import { UpdateSeekerProfileDto } from '../dto/UpdateSeekerProfileDto';
import { UpdateEmployerProfileDto } from '../dto/UpdateEmployerProfileDto';
import { getCityById } from '../clients/dictionary.client';
import { AppError } from '../utils/errors';

export class ProfileService {
  private userRepo = AppDataSource.getRepository(User);
  private seekerRepo = AppDataSource.getRepository(JobSeeker);
  private employerRepo = AppDataSource.getRepository(Employer);

  async updateSeeker(userId: string, dto: UpdateSeekerProfileDto) {
    const seeker = await this.seekerRepo.findOne({
      where: { user_id: userId },
      relations: { user: true },
    });
    if (!seeker) throw new AppError(404, 'Seeker profile not found');

    let city = null;
    if (dto.cityId) {
      city = await getCityById(dto.cityId);
      if (!city) throw new AppError(404, 'City not found');
      seeker.city_id = dto.cityId;
    }

    if (dto.firstName !== undefined) seeker.first_name = dto.firstName;
    if (dto.lastName !== undefined) seeker.last_name = dto.lastName;
    if (dto.middleName !== undefined) seeker.middle_name = dto.middleName;
    if (dto.birthDate !== undefined) seeker.birth_date = dto.birthDate;
    if (dto.gender !== undefined) seeker.gender = dto.gender;

    await this.seekerRepo.save(seeker);

    if (dto.phone !== undefined) {
      await this.userRepo.update(userId, { phone: dto.phone });
      seeker.user.phone = dto.phone;
    }

    return {
      id: seeker.id,
      userId: seeker.user.id,
      firstName: seeker.first_name,
      lastName: seeker.last_name,
      middleName: seeker.middle_name,
      birthDate: seeker.birth_date,
      gender: seeker.gender,
      cityId: seeker.city_id,
      city: city ? { id: city.id, name: city.name, country: city.country } : null,
      email: seeker.user.email,
      phone: seeker.user.phone,
    };
  }

  async updateEmployer(userId: string, dto: UpdateEmployerProfileDto) {
    const employer = await this.employerRepo.findOne({
      where: { user_id: userId },
      relations: { user: true },
    });
    if (!employer) throw new AppError(404, 'Employer profile not found');

    if (dto.firstName !== undefined) employer.first_name = dto.firstName;
    if (dto.lastName !== undefined) employer.last_name = dto.lastName;
    if (dto.position !== undefined) employer.position = dto.position;

    await this.employerRepo.save(employer);

    return {
      id: employer.id,
      firstName: employer.first_name,
      lastName: employer.last_name,
      position: employer.position,
      companyId: employer.company_id,
      email: employer.user.email,
    };
  }
}
