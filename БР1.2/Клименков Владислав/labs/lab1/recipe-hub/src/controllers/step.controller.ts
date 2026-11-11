import type { Response } from 'express'
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { StepService } from '../services/step.service.js';
import { 
    StepReadListSchema, 
    StepReadSchema, 
    type StepCreateType, 
    type StepUpdateType 
} from '../schemas/step.schemas.js';


export class StepController {
    static async getSteps(req: AuthRequest, res: Response) {
            try {
                const { recipeId:recipeIdStr } = req.params;
                const recipeId = parseInt(recipeIdStr as string);
                const steps = await StepService.getSteps(recipeId);
                res.status(200).json(StepReadListSchema.parse(steps));
            } catch (error: any) {
                res.status(400).json({
                    message: error.message,
                });
            };
        };
    
    static async addStep(req: AuthRequest, res: Response) {
        try {
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const stepCreateData: StepCreateType = req.body;
            const step = await StepService.addStep(recipeId, stepCreateData);
            res.status(201).json(StepReadSchema.parse(step));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getStep(req: AuthRequest, res: Response) {
        try {
            const { stepId:stepIdStr } = req.params;
            const stepId = parseInt(stepIdStr as string);
            const step = await StepService.getStep(stepId);
            res.status(200).json(StepReadSchema.parse(step));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateStep(req: AuthRequest, res: Response) {
        try {
            const { stepId:stepIdStr } = req.params;
            const stepId = parseInt(stepIdStr as string);
            const stepUpdateData: StepUpdateType = req.body;
            const step = await StepService.updateStep(stepId, stepUpdateData);
            res.status(200).json(StepReadSchema.parse(step));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteStep(req: AuthRequest, res: Response) {
        try {
            const { stepId:stepIdStr } = req.params;
            const stepId = parseInt(stepIdStr as string);
            await StepService.deleteStep(stepId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
};
