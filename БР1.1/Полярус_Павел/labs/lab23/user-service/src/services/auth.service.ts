import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { JobSeeker } from '../entities/JobSeeker';
import { Employer } from '../entities/Employer';
import { RegisterStep1Dto } from '../dto/RegisterStep1Dto';
import { RegisterSeekerDto } from '../dto/RegisterSeekerDto';
import { RegisterEmployerDto } from '../dto/RegisterEmployerDto';
import { LoginDto } from '../dto/LoginDto';
import { getCityById, CityDto } from '../clients/dictionary.client';
import { AppError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_TEMP_EXPIRES_IN = process.env.JWT_TEMP_EXPIRES_IN || '15m';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

function signAccess(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function buildSeekerProfile(user: User, seeker: JobSeeker, city?: CityDto | null) {
  return {
    id: seeker.id,
    userId: user.id,
    firstName: seeker.first_name,
    lastName: seeker.last_name,
    middleName: seeker.middle_name,
    birthDate: seeker.birth_date,
    gender: seeker.gender,
    cityId: seeker.city_id,
    city: city ? { id: city.id, name: city.name, country: city.country } : null,
    email: user.email,
    phone: user.phone,
  };
}

function buildEmployerProfile(user: User, employer: Employer) {
  return {
    id: employer.id,
    userId: user.id,
    firstName: employer.first_name,
    lastName: employer.last_name,
    position: employer.position,
    companyId: employer.company_id,
    email: user.email,
  };
}

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private seekerRepo = AppDataSource.getRepository(JobSeeker);
  private employerRepo = AppDataSource.getRepository(Employer);

  async step1(dto: RegisterStep1Dto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new AppError(409, 'Email already in use');

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      email: dto.email,
      phone: dto.phone ?? null,
      password_hash,
      role: dto.role,
    });
    await this.userRepo.save(user);

    const temporaryToken = jwt.sign(
      { sub: user.id, role: user.role, step: 'register' },
      JWT_SECRET,
      { expiresIn: JWT_TEMP_EXPIRES_IN } as jwt.SignOptions,
    );

    return { temporaryToken };
  }

  async registerSeeker(userId: string, dto: RegisterSeekerDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const city = await getCityById(dto.cityId);
    if (!city) throw new AppError(404, 'City not found');

    const seeker = this.seekerRepo.create({
      user_id: userId,
      city_id: dto.cityId,
      first_name: dto.firstName,
      last_name: dto.lastName,
      middle_name: dto.middleName ?? null,
      birth_date: dto.birthDate ?? null,
      gender: dto.gender ?? null,
    });
    await this.seekerRepo.save(seeker);

    const accessToken = signAccess(user.id, user.role);
    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: buildSeekerProfile(user, seeker, city),
      },
    };
  }

  async registerEmployer(userId: string, dto: RegisterEmployerDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const employer = this.employerRepo.create({
      user_id: userId,
      company_id: dto.companyId ?? null,
      first_name: dto.firstName,
      last_name: dto.lastName,
      position: dto.position ?? null,
    });
    await this.employerRepo.save(employer);

    const accessToken = signAccess(user.id, user.role);
    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: buildEmployerProfile(user, employer),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: { jobSeeker: true, employer: true },
    });
    if (!user) throw new AppError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const accessToken = signAccess(user.id, user.role);

    let profile = null;
    if (user.role === UserRole.SEEKER && user.jobSeeker) {
      profile = buildSeekerProfile(user, user.jobSeeker);
    } else if (user.role === UserRole.EMPLOYER && user.employer) {
      profile = buildEmployerProfile(user, user.employer);
    }

    return { accessToken, tokenType: 'Bearer', user: { id: user.id, email: user.email, role: user.role, profile } };
  }

  async me(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { jobSeeker: true, employer: true },
    });
    if (!user) throw new AppError(404, 'User not found');

    let profile = null;
    if (user.role === UserRole.SEEKER && user.jobSeeker) {
      profile = buildSeekerProfile(user, user.jobSeeker);
    } else if (user.role === UserRole.EMPLOYER && user.employer) {
      profile = buildEmployerProfile(user, user.employer);
    }

    return { id: user.id, email: user.email, role: user.role, profile };
  }
}
