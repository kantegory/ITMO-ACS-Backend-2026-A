import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { repos } from './repos';

const INDUSTRIES = [
  'Информационные технологии',
  'Финансы и банки',
  'Маркетинг и реклама',
  'Образование',
  'Розничная торговля',
  'Производство',
];

const SKILLS = [
  'JavaScript', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'TypeORM',
  'React', 'Vue', 'Docker', 'Git', 'REST API', 'Python', 'SQL', 'Linux',
];

const run = async (): Promise<void> => {
  await AppDataSource.initialize();

  for (const name of INDUSTRIES) {
    const exists = await repos.industry().findOne({ where: { name } });
    if (!exists) await repos.industry().save(repos.industry().create({ name }));
  }

  for (const name of SKILLS) {
    const exists = await repos.skill().findOne({ where: { name } });
    if (!exists) await repos.skill().save(repos.skill().create({ name }));
  }

  // eslint-disable-next-line no-console
  console.log(`Seed completed: ${INDUSTRIES.length} industries, ${SKILLS.length} skills`);
  await AppDataSource.destroy();
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
