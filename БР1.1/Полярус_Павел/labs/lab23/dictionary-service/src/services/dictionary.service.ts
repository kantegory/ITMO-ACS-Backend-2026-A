import { AppDataSource } from '../config/database';
import { Country } from '../entities/Country';
import { City } from '../entities/City';
import { Industry } from '../entities/Industry';
import { Skill } from '../entities/Skill';
import { EmploymentType } from '../entities/EmploymentType';
import { DegreeType } from '../entities/DegreeType';
import { AppError } from '../utils/errors';

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

  getCities() {
    return this.cityRepo.find({ relations: { country: true } });
  }

  getIndustries() {
    return this.industryRepo.find();
  }

  getSkills() {
    return this.skillRepo.find();
  }

  getEmploymentTypes() {
    return this.employmentTypeRepo.find();
  }

  getDegreeTypes() {
    return this.degreeTypeRepo.find();
  }

  async getCityById(id: string) {
    const city = await this.cityRepo.findOne({ where: { id }, relations: { country: true } });
    if (!city) throw new AppError(404, 'City not found');
    return city;
  }

  async getIndustryById(id: string) {
    const item = await this.industryRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Industry not found');
    return item;
  }

  async getSkillById(id: string) {
    const item = await this.skillRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Skill not found');
    return item;
  }

  async getEmploymentTypeById(id: string) {
    const item = await this.employmentTypeRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Employment type not found');
    return item;
  }

  async getDegreeTypeById(id: string) {
    const item = await this.degreeTypeRepo.findOne({ where: { id } });
    if (!item) throw new AppError(404, 'Degree type not found');
    return item;
  }
}
