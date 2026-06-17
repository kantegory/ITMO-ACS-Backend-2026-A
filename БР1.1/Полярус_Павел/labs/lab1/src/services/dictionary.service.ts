import { AppDataSource } from '../config/database';
import { Country } from '../entities/Country';
import { City } from '../entities/City';
import { Industry } from '../entities/Industry';
import { Skill } from '../entities/Skill';
import { EmploymentType } from '../entities/EmploymentType';
import { DegreeType } from '../entities/DegreeType';
import { CreateNameDto, UpdateNameDto, CreateCityDto, UpdateCityDto } from '../dto/DictionaryDto';
import { AppError } from '../utils/errors';

function isFkError(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23503'
  );
}

export class DictionaryService {
  private countryRepo = AppDataSource.getRepository(Country);
  private cityRepo = AppDataSource.getRepository(City);
  private industryRepo = AppDataSource.getRepository(Industry);
  private skillRepo = AppDataSource.getRepository(Skill);
  private employmentTypeRepo = AppDataSource.getRepository(EmploymentType);
  private degreeTypeRepo = AppDataSource.getRepository(DegreeType);

  getCountries() {
    return this.countryRepo.find();
  }

  async createCountry(dto: CreateNameDto) {
    const country = this.countryRepo.create({ name: dto.name });
    return this.countryRepo.save(country);
  }

  async updateCountry(id: string, dto: UpdateNameDto) {
    const country = await this.countryRepo.findOne({ where: { id } });
    if (!country) throw new AppError(404, 'Country not found');
    if (dto.name !== undefined) country.name = dto.name;
    return this.countryRepo.save(country);
  }

  async deleteCountry(id: string) {
    const country = await this.countryRepo.findOne({ where: { id } });
    if (!country) throw new AppError(404, 'Country not found');
    try {
      await this.countryRepo.remove(country);
    } catch (err) {
      if (isFkError(err)) throw new AppError(409, 'Country has dependent records');
      throw err;
    }
  }

  getCities() {
    return this.cityRepo.find({ relations: { country: true } });
  }

  async createCity(dto: CreateCityDto) {
    const country = await this.countryRepo.findOne({ where: { id: dto.countryId } });
    if (!country) throw new AppError(404, 'Country not found');
    const city = this.cityRepo.create({ name: dto.name, country_id: dto.countryId });
    await this.cityRepo.save(city);
    city.country = country;
    return city;
  }

  async updateCity(id: string, dto: UpdateCityDto) {
    const city = await this.cityRepo.findOne({ where: { id }, relations: { country: true } });
    if (!city) throw new AppError(404, 'City not found');
    if (dto.countryId !== undefined) {
      const country = await this.countryRepo.findOne({ where: { id: dto.countryId } });
      if (!country) throw new AppError(404, 'Country not found');
      city.country_id = dto.countryId;
      city.country = country;
    }
    if (dto.name !== undefined) city.name = dto.name;
    return this.cityRepo.save(city);
  }

  async deleteCity(id: string) {
    const city = await this.cityRepo.findOne({ where: { id } });
    if (!city) throw new AppError(404, 'City not found');
    try {
      await this.cityRepo.remove(city);
    } catch (err) {
      if (isFkError(err)) throw new AppError(409, 'City has dependent records');
      throw err;
    }
  }

  getIndustries() {
    return this.industryRepo.find();
  }

  async createIndustry(dto: CreateNameDto) {
    return this.industryRepo.save(this.industryRepo.create({ name: dto.name }));
  }

  async updateIndustry(id: string, dto: UpdateNameDto) {
    const item = await this.industryRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Industry not found');
    if (dto.name !== undefined) item.name = dto.name;
    return this.industryRepo.save(item);
  }

  async deleteIndustry(id: string) {
    const item = await this.industryRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Industry not found');
    try {
      await this.industryRepo.remove(item);
    } catch (err) {
      if (isFkError(err)) throw new AppError(409, 'Industry has dependent records');
      throw err;
    }
  }

  getSkills() {
    return this.skillRepo.find();
  }

  async createSkill(dto: CreateNameDto) {
    return this.skillRepo.save(this.skillRepo.create({ name: dto.name }));
  }

  async updateSkill(id: string, dto: UpdateNameDto) {
    const item = await this.skillRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Skill not found');
    if (dto.name !== undefined) item.name = dto.name;
    return this.skillRepo.save(item);
  }

  async deleteSkill(id: string) {
    const item = await this.skillRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Skill not found');
    try {
      await this.skillRepo.remove(item);
    } catch (err) {
      if (isFkError(err)) throw new AppError(409, 'Skill has dependent records');
      throw err;
    }
  }

  getEmploymentTypes() {
    return this.employmentTypeRepo.find();
  }

  async createEmploymentType(dto: CreateNameDto) {
    return this.employmentTypeRepo.save(this.employmentTypeRepo.create({ name: dto.name }));
  }

  async updateEmploymentType(id: string, dto: UpdateNameDto) {
    const item = await this.employmentTypeRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Employment type not found');
    if (dto.name !== undefined) item.name = dto.name;
    return this.employmentTypeRepo.save(item);
  }

  async deleteEmploymentType(id: string) {
    const item = await this.employmentTypeRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Employment type not found');
    try {
      await this.employmentTypeRepo.remove(item);
    } catch (err) {
      if (isFkError(err)) throw new AppError(409, 'Employment type has dependent records');
      throw err;
    }
  }

  getDegreeTypes() {
    return this.degreeTypeRepo.find();
  }

  async createDegreeType(dto: CreateNameDto) {
    return this.degreeTypeRepo.save(this.degreeTypeRepo.create({ name: dto.name }));
  }

  async updateDegreeType(id: string, dto: UpdateNameDto) {
    const item = await this.degreeTypeRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Degree type not found');
    if (dto.name !== undefined) item.name = dto.name;
    return this.degreeTypeRepo.save(item);
  }

  async deleteDegreeType(id: string) {
    const item = await this.degreeTypeRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Degree type not found');
    try {
      await this.degreeTypeRepo.remove(item);
    } catch (err) {
      if (isFkError(err)) throw new AppError(409, 'Degree type has dependent records');
      throw err;
    }
  }
}
