import z from "zod";


export const IsSubscribedToUserReadSchema = z.object({
    isSubscribed: z.boolean()
});
export type IsSubscribedToUserReadType = z.infer<typeof IsSubscribedToUserReadSchema>;
