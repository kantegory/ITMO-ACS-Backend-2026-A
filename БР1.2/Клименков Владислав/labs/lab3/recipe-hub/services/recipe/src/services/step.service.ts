import type { MediaType } from "../generated/prisma/client";
import { prisma } from "../config/database.js";
import type { StepCreateType, StepUpdateType } from "../schemas/step.schemas.js";

export class StepService {
    static async getSteps(recipeId: number) {
        const steps = await prisma.recipeStep.findMany({
            where: { recipeId },
            orderBy: { number: 'asc' },
            include: {
                media: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        return steps.map(step => ({
            ...step,
            media: step.media.map(media => ({
                ...media,
                mediaType: media.mediaType,
            })),
        }));
    };

    static async addStep(recipeId: number, stepCreateData: StepCreateType) {
        const { number, title, description, media } = stepCreateData;
        if (media) {
            for (const m of media) {
                if (!['photo', 'video'].includes(m.mediaType)) {
                    throw new Error(`Некорректный mediaType: ${m.mediaType}. Допустимые значения: photo, video`);
                }
            }
        }
        const newStep = await prisma.$transaction(async (tx) => {
            const step = await tx.recipeStep.create({
                data: {
                    recipeId,
                    number,
                    title,
                    description: description ?? null,
                },
            });

            if (media && media.length > 0) {
                await tx.recipeStepMedia.createMany({
                    data: media.map((m, idx) => ({
                        recipeStepId: step.id,
                        sortOrder: m.sortOrder ?? idx,
                        mediaType: m.mediaType as MediaType,
                        mediaUrl: m.mediaUrl,
                    })),
                });
            }

            return tx.recipeStep.findUnique({
                where: { id: step.id },
                include: {
                    media: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
        });

        if (!newStep) {
            throw new Error('Не удалось создать шаг');
        }

        return {
            ...newStep,
            media: newStep.media.map(m => ({
                ...m,
                mediaType: m.mediaType,
            })),
        };
    };

    static async getStep(stepId: number) {
        const step = await prisma.recipeStep.findUnique({
            where: { id: stepId },
            include: {
                media: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!step) {
            throw new Error('Шаг не найден');
        }

        return {
            ...step,
            media: step.media.map(m => ({
                ...m,
                mediaType: m.mediaType,
            })),
        };
    };

    static async updateStep(stepId: number, stepUpdateData: StepUpdateType) {
        const { number, title, description, media } = stepUpdateData;

        if (media) {
            for (const m of media) {
                if (m.mediaType && !['photo', 'video'].includes(m.mediaType)) {
                    throw new Error(`Некорректный mediaType: ${m.mediaType}. Допустимые значения: photo, video`);
                }
            }
        }

        const updatedStep = await prisma.$transaction(async (tx) => {
            const updateData: {
                number?: number;
                title?: string;
                description?: string | null;
            } = {};
            
            if (number !== undefined) updateData.number = number;
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;

            await tx.recipeStep.update({
                where: { id: stepId },
                data: updateData,
            });

            if (media !== undefined) {
                await tx.recipeStepMedia.deleteMany({
                    where: { recipeStepId: stepId },
                });

                if (media.length > 0) {
                    await tx.recipeStepMedia.createMany({
                        data: media.map((m, idx) => ({
                            recipeStepId: stepId,
                            sortOrder: m.sortOrder ?? idx,
                            mediaType: (m.mediaType ?? 'photo') as MediaType,
                            mediaUrl: m.mediaUrl ?? '',
                        })),
                    });
                }
            }

            return tx.recipeStep.findUnique({
                where: { id: stepId },
                include: {
                    media: { orderBy: { sortOrder: 'asc' } },
                },
            });
        });

        if (!updatedStep) {
            throw new Error('Шаг не найден');
        }

        return {
            ...updatedStep,
            media: updatedStep.media.map(m => ({
                ...m,
                mediaType: m.mediaType,
            })),
        };
    }

    static async deleteStep(stepId: number) {
        await prisma.recipeStep.delete({
            where: { id: stepId },
        });
    };

    static async isCorrectStepId(stepId: number, recipeId: number) {
        const count = await prisma.recipeStep.count({
            where: {
                id: stepId,
                recipeId,
            },
        });
        return count > 0;
    };
}