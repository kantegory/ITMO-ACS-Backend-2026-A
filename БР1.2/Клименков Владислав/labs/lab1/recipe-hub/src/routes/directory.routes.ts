import { Router } from 'express'
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import validate, { setGlobalOptions } from 'express-zod-safe';
import { 
    DishTypeCreateSchema, 
    DishTypeUpdateSchema, 
    IngredientCreateSchema,
    IngredientUpdateSchema
} from '../schemas/directory.schemas.js';
import { DirectoryController } from '../controllers/directory.controller.js';

setGlobalOptions({
    missingSchemaBehavior: 'any'
});

const directoryRouter = Router();

directoryRouter.get('/dish-types',
    authMiddleware,
    DirectoryController.getDishTypes
);

directoryRouter.post('/dish-types',
    authMiddleware,
    isAdmin,
    validate({
        body: DishTypeCreateSchema
    }),
    DirectoryController.addDishType
);

directoryRouter.get('/dish-types/:dishTypeId',
    authMiddleware,
    DirectoryController.getDishType
);

directoryRouter.patch('/dish-types/:dishTypeId',
    authMiddleware,
    isAdmin,
    validate({
        body: DishTypeUpdateSchema
    }),
    DirectoryController.updateDishType
);

directoryRouter.delete('/dish-types/:dishTypeId',
    authMiddleware,
    isAdmin,
    DirectoryController.deleteDishType
);

directoryRouter.get('/ingredients',
    authMiddleware,
    DirectoryController.getIngredients
);

directoryRouter.post('/ingredients',
    authMiddleware,
    isAdmin,
    validate({
        body: IngredientCreateSchema
    }),
    DirectoryController.addIngredient
);

directoryRouter.get('/ingredients/:ingredientId',
    authMiddleware,
    DirectoryController.getIngredient
);

directoryRouter.patch('/ingredients/:ingredientId',
    authMiddleware,
    isAdmin,
    validate({
        body: IngredientUpdateSchema
    }),
    DirectoryController.updateIngredient
);

directoryRouter.delete('/ingredients/:ingredientId',
    authMiddleware,
    isAdmin,
    DirectoryController.deleteIngredient
);

export default directoryRouter;
