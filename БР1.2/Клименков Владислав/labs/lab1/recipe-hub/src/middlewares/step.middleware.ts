import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import { StepService } from '../services/step.service.js';


export const isCorrectStepId = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { recipeId: recipeIdStr, stepId: stepIdStr } = req.params;
    const recipeId = parseInt(recipeIdStr as string);
    const stepId = parseInt(stepIdStr as string);
    const isValid = await StepService.isCorrectStepId(stepId, recipeId);
    if (!isValid) {
        res.status(400).json({
            message: "Данный шаг не принадлежит данному рецепту"
        });
        return;
    }
    next();
};
