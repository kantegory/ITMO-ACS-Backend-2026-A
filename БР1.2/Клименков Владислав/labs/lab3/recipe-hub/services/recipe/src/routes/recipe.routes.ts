import { Router } from 'express'
import validate, { setGlobalOptions } from 'express-zod-safe';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { RecipeController } from '../controllers/recipe.controller.js';
import { 
    RecipeCreateSchema, 
    RecipeRatingPutSchema, 
    RecipeUpdateSchema, 
} from '../schemas/recipe.schemas.js';


setGlobalOptions({
    missingSchemaBehavior: 'any'
});

const recipeRouter = Router();

recipeRouter.get('/users/me/recipes',
    authMiddleware,
    RecipeController.getCurrentUserRecipes
);

recipeRouter.get('/users/me/saved-recipes',
    authMiddleware,
    RecipeController.getCurrentUserSavedRecipes
);

recipeRouter.get('/users/:userId/recipes',
    authMiddleware,
    RecipeController.getUserRecipes
);

recipeRouter.get('/users/:userId/saved-recipes',
    authMiddleware,
    RecipeController.getUserSavedRecipes
);

recipeRouter.get('/recipes',
    authMiddleware,
    RecipeController.getRecipes
);

recipeRouter.post('/recipes',
    authMiddleware,
    validate({
        body: RecipeCreateSchema
    }),
    RecipeController.addRecipe
);

recipeRouter.get('/recipes/:recipeId',
    authMiddleware,
    RecipeController.getRecipe
);

recipeRouter.patch('/recipes/:recipeId',
    authMiddleware,
    RecipeController.isRecipeAuthor,
    validate({
        body: RecipeUpdateSchema
    }),
    RecipeController.updateRecipe
);

recipeRouter.delete('/recipes/:recipeId',
    authMiddleware,
    RecipeController.isRecipeAuthorOrAdmin,
    RecipeController.deleteRecipe
);

recipeRouter.get('/recipes/:recipeId/rating',
    authMiddleware,
    RecipeController.getRecipeRating
);

recipeRouter.put('/recipes/:recipeId/rating',
    authMiddleware,
    validate({
        body: RecipeRatingPutSchema
    }),
    RecipeController.putRecipeRating
);

recipeRouter.delete('/recipes/:recipeId/rating',
    authMiddleware,
    RecipeController.deleteRecipeRating
);

recipeRouter.get('/recipes/:recipeId/save',
    authMiddleware,
    RecipeController.isRecipeSaved
);

recipeRouter.post('/recipes/:recipeId/save',
    authMiddleware,
    RecipeController.saveRecipe
);

recipeRouter.delete('/recipes/:recipeId/save',
    authMiddleware,
    RecipeController.unsaveRecipe
);

export default recipeRouter;
