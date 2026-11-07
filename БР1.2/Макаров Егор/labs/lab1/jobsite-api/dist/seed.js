"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("./data-source");
const repos_1 = require("./repos");
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
const run = async () => {
    await data_source_1.AppDataSource.initialize();
    for (const name of INDUSTRIES) {
        const exists = await repos_1.repos.industry().findOne({ where: { name } });
        if (!exists)
            await repos_1.repos.industry().save(repos_1.repos.industry().create({ name }));
    }
    for (const name of SKILLS) {
        const exists = await repos_1.repos.skill().findOne({ where: { name } });
        if (!exists)
            await repos_1.repos.skill().save(repos_1.repos.skill().create({ name }));
    }
    // eslint-disable-next-line no-console
    console.log(`Seed completed: ${INDUSTRIES.length} industries, ${SKILLS.length} skills`);
    await data_source_1.AppDataSource.destroy();
};
run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map