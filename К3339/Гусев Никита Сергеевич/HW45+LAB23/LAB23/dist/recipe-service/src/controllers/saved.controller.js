"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedController = void 0;
const data_source_1 = require("../data-source");
const SavedRecipe_1 = require("../entities/SavedRecipe");
const savedRepository = data_source_1.AppDataSource.getRepository(SavedRecipe_1.SavedRecipe);
class SavedController {
    static async create(req, res) {
        const saved = savedRepository.create({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        });
        await savedRepository.save(saved);
        return res.status(201).json(saved);
    }
    static async delete(req, res) {
        const saved = await savedRepository.findOneBy({
            recipe_id: Number(req.params.id),
            user_id: req.body.user_id
        });
        if (!saved) {
            return res.status(404).json({
                message: "Saved recipe not found"
            });
        }
        await savedRepository.remove(saved);
        return res.status(204).send();
    }
}
exports.SavedController = SavedController;
