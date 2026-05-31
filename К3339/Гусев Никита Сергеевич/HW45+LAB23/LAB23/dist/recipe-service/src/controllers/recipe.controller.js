"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeController = void 0;
const data_source_1 = require("../data-source");
const Recipe_1 = require("../entities/Recipe");
const recipeRepository = data_source_1.AppDataSource.getRepository(Recipe_1.Recipe);
class RecipeController {
    static async getAll(req, res) {
        const { title, difficulty } = req.query;
        const query = recipeRepository
            .createQueryBuilder("recipe");
        if (title) {
            query.where("recipe.title ILIKE :title", { title: `%${title}%` });
        }
        if (difficulty) {
            query.andWhere("recipe.difficulty = :difficulty", { difficulty });
        }
        const recipes = await query.getMany();
        return res.json(recipes);
    }
    static async getOne(req, res) {
        const recipe = await recipeRepository.findOne({
            where: {
                id: Number(req.params.id)
            }
        });
        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }
        return res.json(recipe);
    }
    static async create(req, res) {
        const recipe = recipeRepository.create(req.body);
        await recipeRepository.save(recipe);
        return res.status(201).json(recipe);
    }
    static async update(req, res) {
        const recipe = await recipeRepository.findOneBy({
            id: Number(req.params.id)
        });
        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }
        recipeRepository.merge(recipe, req.body);
        await recipeRepository.save(recipe);
        return res.json(recipe);
    }
    static async delete(req, res) {
        const recipe = await recipeRepository.findOneBy({
            id: Number(req.params.id)
        });
        if (!recipe) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }
        await recipeRepository.remove(recipe);
        return res.status(204).send();
    }
}
exports.RecipeController = RecipeController;
