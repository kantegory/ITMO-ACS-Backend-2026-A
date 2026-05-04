import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { JobSeeker } from '../entities/JobSeeker';
import { Employer } from '../entities/Employer';
import { City } from '../entities/City';
import { UpdateSeekerProfileDto } from '../dto/UpdateSeekerProfileDto';
import { UpdateEmployerProfileDto } from '../dto/UpdateEmployerProfileDto';
import { AppError } from '../utils/errors';

export class ProfileService {
  private userRepo = AppDataSource.getRepository(User);
  private seekerRepo = AppDataSource.getRepository(JobSeeker);
  private employerRepo = AppDataSource.getRepository(Employer);
  private cityRepo = AppDataSource.getRepository(City);

  async updateSeeker(userId: string, dto: UpdateSeekerProfileDto) {
    const seeker = await this.seekerRepo.findOne({
      where: { user_id: userId },
      relations: { city: { country: true }, user: true },
    });
    if (!seeker) throw new AppError(404, 'Seeker profile not found');

    if (dto.cityId) {
      const city = await this.cityRepo.findOne({
        where: { id: dto.cityId },
        relations: { country: true },
      });
      if (!city) throw new AppError(404, 'City not found');
      seeker.city_id = dto.cityId;
      seeker.city = city;
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
      city: {
        id: seeker.city.id,
        name: seeker.city.name,
        country: seeker.city.country
          ? { id: seeker.city.country.id, name: seeker.city.country.name }
          : null,
      },
      email: seeker.user.email,
      phone: seeker.user.phone,
    };
  }

  async updateEmployer(userId: string, dto: UpdateEmployerProfileDto) {
    const employer = await this.employerRepo.findOne({
      where: { user_id: userId },
      relations: { company: { city: { country: true } }, user: true },
    });
    if (!employer) throw new AppError(404, 'Employer profile not found');

    if (dto.firstName !== undefined) employer.first_name = dto.firstName;
    if (dto.lastName !== undefined) employer.last_name = dto.lastName;
    if (dto.position !== undefined) employer.position = dto.position;

    await this.employerRepo.save(employer);

    const company = employer.company;
    return {
      id: employer.id,
      firstName: employer.first_name,
      lastName: employer.last_name,
      position: employer.position,
      email: employer.user.email,
      company: company
        ? {
            id: company.id,
            name: company.name,
            logoUrl: company.logo_url,
            city: company.city
              ? {
                  id: company.city.id,
                  name: company.city.name,
                  country: company.city.country
                    ? { id: company.city.country.id, name: company.city.country.name }
                    : null,
                }
              : null,
          }
        : null,
    };
  }
}
