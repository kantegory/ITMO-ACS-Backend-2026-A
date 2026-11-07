"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSkill = exports.listSkills = exports.listIndustries = void 0;
const typeorm_1 = require("typeorm");
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const pagination_1 = require("../utils/pagination");
const presenters_1 = require("../presenters");
const listIndustries = async (_req, res) => {
    const items = await repos_1.repos.industry().find({ order: { name: 'ASC' } });
    res.json(items.map(presenters_1.presentIndustry));
};
exports.listIndustries = listIndustries;
const listSkills = async (req, res) => {
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    const where = req.query.search ? { name: (0, typeorm_1.ILike)(`%${req.query.search}%`) } : {};
    const [items, total] = await repos_1.repos.skill().findAndCount({
        where, skip, take, order: { name: 'ASC' },
    });
    res.json({ data: items.map(presenters_1.presentSkill), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listSkills = listSkills;
const createSkill = async (req, res) => {
    const name = req.body.name.trim();
    const exists = await repos_1.repos.skill().findOne({ where: { name } });
    if (exists)
        throw httpError_1.HttpError.conflict('Навык уже существует');
    const skill = repos_1.repos.skill().create({ name });
    await repos_1.repos.skill().save(skill);
    res.status(201).json((0, presenters_1.presentSkill)(skill));
};
exports.createSkill = createSkill;
//# sourceMappingURL=dictionaryController.js.map