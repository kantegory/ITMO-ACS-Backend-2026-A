import { Router } from 'express';
import validate, { setGlobalOptions } from 'express-zod-safe';
import { 
    authMiddleware
} from '../middleware/auth.middleware.js';
import { StepController } from '../controllers/step.controller.js';
import { 
    StepCreateSchema, 
    StepUpdateSchema 
} from '../schemas/step.schemas.js';

setGlobalOptions({
    missingSchemaBehavior: 'any'
});

const stepRouter = Router();

stepRouter.get('/recipes/:recipeId/steps',
    authMiddleware,
    StepController.getSteps
);

stepRouter.post('/recipes/:recipeId/steps',
    authMiddleware,
    validate({
        body: StepCreateSchema
    }),
    StepController.addStep
);

stepRouter.get('/recipes/:recipeId/steps/:stepId',
    authMiddleware,
    StepController.isCorrectStepId,
    StepController.getStep
);

stepRouter.patch('/recipes/:recipeId/steps/:stepId',
    authMiddleware,
    StepController.isCorrectStepId,
    validate({
        body: StepUpdateSchema
    }),
    StepController.updateStep
);

stepRouter.delete('/recipes/:recipeId/steps/:stepId',
    authMiddleware,
    StepController.isCorrectStepId,
    StepController.deleteStep
);

export default stepRouter;