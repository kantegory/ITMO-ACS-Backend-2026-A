import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { SavedRecipe } from "../entities/SavedRecipe"

const savedRepository =
    AppDataSource.getRepository(SavedRecipe)

export class SavedController {

    static async create(req: Request, res: Response) {

        const saved = savedRepository.create({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        })

        await savedRepository.save(saved)

        return res.status(201).json(saved)
    }

    static async delete(req: Request, res: Response) {

        const saved = await savedRepository.findOneBy({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        })

        if (!saved) {
            return res.status(404).json({
                message: "Saved recipe not found"
            })
        }

        await savedRepository.remove(saved)

        return res.status(204).send()
    }
}