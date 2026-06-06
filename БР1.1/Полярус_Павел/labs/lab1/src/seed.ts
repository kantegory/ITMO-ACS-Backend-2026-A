import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Country } from './entities/Country';
import { City } from './entities/City';
import { Industry } from './entities/Industry';
import { Skill } from './entities/Skill';
import { EmploymentType } from './entities/EmploymentType';
import { DegreeType } from './entities/DegreeType';

const COUNTRIES = ['Россия', 'Беларусь', 'Казахстан', 'Армения', 'Грузия'];

const CITIES: { name: string; country: string }[] = [
  { name: 'Москва', country: 'Россия' },
  { name: 'Санкт-Петербург', country: 'Россия' },
  { name: 'Новосибирск', country: 'Россия' },
  { name: 'Екатеринбург', country: 'Россия' },
  { name: 'Казань', country: 'Россия' },
  { name: 'Нижний Новгород', country: 'Россия' },
  { name: 'Краснодар', country: 'Россия' },
  { name: 'Минск', country: 'Беларусь' },
  { name: 'Алматы', country: 'Казахстан' },
  { name: 'Ереван', country: 'Армения' },
  { name: 'Тбилиси', country: 'Грузия' },
];

const INDUSTRIES = [
  'Информационные технологии',
  'Финансы и банки',
  'Медицина и фармацевтика',
  'Образование',
  'Производство',
  'Торговля и ритейл',
  'Строительство',
  'Транспорт и логистика',
  'Маркетинг и реклама',
  'Юриспруденция',
];

const SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'Node.js', 'React', 'Vue.js', 'Angular',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'Git',
  'Java', 'Go', 'C#', 'PHP', 'Swift', 'Kotlin',
  'HTML/CSS', 'REST API', 'GraphQL', 'Microservices', 'Linux',
];

const EMPLOYMENT_TYPES = [
  'Полная занятость',
  'Частичная занятость',
  'Проектная работа',
  'Стажировка',
  'Волонтёрство',
];

const DEGREE_TYPES = [
  'Среднее общее',
  'Среднее специальное',
  'Бакалавр',
  'Специалист',
  'Магистр',
  'Аспирантура / PhD',
];

async function seedList<T extends { name: string }>(
  ds: DataSource,
  Entity: new () => T,
  names: string[],
): Promise<void> {
  const repo = ds.getRepository(Entity);
  for (const name of names) {
    const exists = await repo.findOne({ where: { name } as never });
    if (!exists) {
      await repo.save(repo.create({ name } as never));
    }
  }
}

export async function runSeed(ds: DataSource): Promise<void> {
  // Countries
  const countryRepo = ds.getRepository(Country);
  const savedCountries: Record<string, Country> = {};
  for (const name of COUNTRIES) {
    let c = await countryRepo.findOne({ where: { name } });
    if (!c) {
      c = await countryRepo.save(countryRepo.create({ name }));
    }
    savedCountries[name] = c;
  }

  // Cities
  const cityRepo = ds.getRepository(City);
  for (const { name, country } of CITIES) {
    const exists = await cityRepo.findOne({ where: { name } });
    if (!exists) {
      await cityRepo.save(cityRepo.create({ name, country_id: savedCountries[country].id }));
    }
  }

  await seedList(ds, Industry, INDUSTRIES);
  await seedList(ds, Skill, SKILLS);
  await seedList(ds, EmploymentType, EMPLOYMENT_TYPES);
  await seedList(ds, DegreeType, DEGREE_TYPES);

  console.log('Seed complete');
}
