import z from "zod";
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatar: z.string().url(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;