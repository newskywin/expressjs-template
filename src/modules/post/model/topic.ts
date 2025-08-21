import z from "zod";
import { ERROR_TOPIC_COLOR_INVALID, ERROR_TOPIC_NAME_INVALID } from "./error";

export const topicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, ERROR_TOPIC_NAME_INVALID.message),
  postCount: z.number().int().nonnegative().default(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/i, ERROR_TOPIC_COLOR_INVALID.message)
    .default("#008000"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Topic = z.infer<typeof topicSchema>;