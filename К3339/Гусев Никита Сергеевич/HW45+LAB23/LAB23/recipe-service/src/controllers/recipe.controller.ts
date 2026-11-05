import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Recipe } from "../entities/Recipe"
import { AuthRequest } from "../../../shared/auth"
import { internalRequest } from "../../../shared/internal"

const recipeRepository = AppDataSource.getRepository(Recipe)

export class RecipeController {

    static async getAll(req: Request, res: Response) {

        const search = req.query.query ?? req.query.title
        const difficulty = req.query.difficulty

        if (
            search !== undefined &&
            (typeof search !== "string" || search.trim().length < 1 || search.trim().length > 255)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid search query"
            })
        }

        if (
            difficulty !== undefined &&
            (typeof difficulty !== "string" || !["easy", "medium", "hard"].includes(difficulty))
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid difficulty"
            })
        }

        const query = recipeRepository.createQueryBuilder("recipe")

        if (typeof search === "string") {
            query.andWhere(
                "recipe.title ILIKE :title",
                { title: "%" + search.trim() + "%" }
            )
        }

        if (difficulty !== undefined) {
            query.andWhere(
                "recipe.difficulty = :difficulty",
                { difficulty }
            )
        }

        query.orderBy("recipe.id", "ASC")

        const recipes = await query.getMany()

        return res.json(recipes)
    }

    static async getOne(req: Request, res: Response) {

        const id = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || id > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const recipe = await recipeRepository.findOneBy({ id })

        if (!recipe) {
            return res.status(404).json({
                error: "NotFound",
                message: "Recipe not found"
            })
        }

        return res.json(recipe)
    }

    static async create(req: AuthRequest, res: Response) {

        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Body must be a JSON object"
            })
        }

        const allowedFields = ["title", "description", "difficulty", "cooking_time", "servings"]
        const hasExtraFields = Object.keys(req.body).some(key => !allowedFields.includes(key))

        if (hasExtraFields) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Unknown fields in request body"
            })
        }

        const { title, description, difficulty, cooking_time, servings } = req.body

        if (
            typeof title !== "string" ||
            title.trim().length < 1 ||
            title.trim().length > 255

        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Title must contain 1 to 255 characters"
            })
        }

        if (
            typeof difficulty !== "string" ||
            !["easy", "medium", "hard"].includes(difficulty)

        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid difficulty"
            })
        }

        if (
            description !== undefined &&
            (typeof description !== "string" || description.trim().length > 10000)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid description"
            })
        }

        if (
            cooking_time !== undefined &&
            (!Number.isInteger(cooking_time) || cooking_time < 1 || cooking_time > 2147483647)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Cooking time must be a positive integer"
            })
        }

        if (
            servings !== undefined &&
            (!Number.isInteger(servings) || servings < 1 || servings > 2147483647)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Servings must be a positive integer"
            })
        }

        const recipe = recipeRepository.create({
            title: title.trim(),
            description: description === undefined ? "" : description.trim(),
            difficulty,
            cooking_time: cooking_time === undefined ? 1 : cooking_time,
            servings: servings === undefined ? 1 : servings,
            authorId: req.userId
        })

        await recipeRepository.save(recipe)

        return res.status(201).json(recipe)
    }

    static async update(req: AuthRequest, res: Response) {

        const id = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || id > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const recipe = await recipeRepository.findOneBy({ id })

        if (!recipe) {
            return res.status(404).json({
                error: "NotFound",
                message: "Recipe not found"
            })
        }

        if (recipe.authorId !== req.userId) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Only the author can update this recipe"
            })
        }

        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Body must be a JSON object"
            })
        }

        const allowedFields = ["title", "description", "difficulty", "cooking_time", "servings"]
        const hasExtraFields = Object.keys(req.body).some(key => !allowedFields.includes(key))

        if (hasExtraFields) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Unknown fields in request body"
            })
        }

        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                error: "BadRequest",
                message: "No fields to update"
            })
        }

        const { title, description, difficulty, cooking_time, servings } = req.body

        if (
            title !== undefined && (
                typeof title !== "string" ||
                title.trim().length < 1 ||
                title.trim().length > 255
            )
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Title must contain 1 to 255 characters"
            })
        }

        if (
            difficulty !== undefined && (
                typeof difficulty !== "string" ||
                !["easy", "medium", "hard"].includes(difficulty)
            )
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid difficulty"
            })
        }

        if (
            description !== undefined &&
            (typeof description !== "string" || description.trim().length > 10000)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Invalid description"
            })
        }

        if (
            cooking_time !== undefined &&
            (!Number.isInteger(cooking_time) || cooking_time < 1 || cooking_time > 2147483647)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Cooking time must be a positive integer"
            })
        }

        if (
            servings !== undefined &&
            (!Number.isInteger(servings) || servings < 1 || servings > 2147483647)
        ) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Servings must be a positive integer"
            })
        }

        if (title !== undefined) {
            recipe.title = title.trim()
        }

        if (description !== undefined) {
            recipe.description = description.trim()
        }

        if (difficulty !== undefined) {
            recipe.difficulty = difficulty
        }

        if (cooking_time !== undefined) {
            recipe.cooking_time = cooking_time
        }

        if (servings !== undefined) {
            recipe.servings = servings
        }

        await recipeRepository.save(recipe)

        return res.json(recipe)
    }

    static async delete(req: AuthRequest, res: Response) {

        const id = Number(req.params.id)

        if (!/^[1-9]\d*$/.test(String(req.params.id)) || id > 2147483647) {
            return res.status(400).json({
                error: "BadRequest",
                message: "ID must be a positive integer"
            })
        }

        const recipe = await recipeRepository.findOneBy({ id })

        if (!recipe) {
            return res.status(404).json({
                error: "NotFound",
                message: "Recipe not found"
            })
        }

        if (recipe.authorId !== req.userId) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Only the author can delete this recipe"
            })
        }

        await internalRequest("comment", "/internal/comments/recipe/" + id, "DELETE")
        await recipeRepository.remove(recipe)

        return res.status(204).send()
    }
}
