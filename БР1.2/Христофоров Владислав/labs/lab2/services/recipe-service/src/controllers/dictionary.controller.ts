import {
    JsonController,
    Get,
    Post,
    Body,
    UseBefore,
    HttpCode,
    HttpError,
} from "routing-controllers";
import dataSource from "../config/data-source";
import { DishType } from "../models/dish-type.entity";
import { Ingredient } from "../models/ingredient.entity";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";
import { CreateDictionaryDto } from "../dto/create-dictionary.dto";

const requireAdminOrModerator = (req: any, res: any, next: any) => {
    const role = req.user?.role;
    if (role !== "admin" && role !== "moderator") {
        return next(
            new HttpError(403, "Доступно только администраторам и модераторам"),
        );
    }
    next();
};

@JsonController()
export class DictionaryController {
    private dishRepo = dataSource.getRepository(DishType);
    private ingRepo = dataSource.getRepository(Ingredient);

    @Get("/dish-types")
    async getDishTypes() {
        return await this.dishRepo.find();
    }

    @Post("/dish-types")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware, requireAdminOrModerator)
    async createDishType(@Body() body: CreateDictionaryDto) {
        const existing = await this.dishRepo.findOneBy({ name: body.name });
        if (existing)
            throw new HttpError(400, "Такая категория уже существует");

        const item = this.dishRepo.create({ name: body.name });
        return await this.dishRepo.save(item);
    }

    @Get("/ingredients")
    async getIngredients() {
        return await this.ingRepo.find();
    }

    @Post("/ingredients")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware, requireAdminOrModerator)
    async createIngredient(@Body() body: CreateDictionaryDto) {
        const existing = await this.ingRepo.findOneBy({ name: body.name });
        if (existing)
            throw new HttpError(400, "Такой ингредиент уже существует");

        const item = this.ingRepo.create({ name: body.name });
        return await this.ingRepo.save(item);
    }
}
