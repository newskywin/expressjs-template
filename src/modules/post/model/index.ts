import z from "zod";
import { ERROR_MIN_CONTENT, ERROR_URL_INVALID } from "./error";
import { Topic } from "./topic";
import { PublicUser } from "@shared/model/public-user";

export enum PostType {
  TEXT = "text",
  MEDIA = "media",
}
export const postSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, { message: ERROR_MIN_CONTENT(1).message }),
  image: z.string().url({ message: ERROR_URL_INVALID.message }).optional(),
  authorId: z.string().uuid(),
  topicId: z.string().uuid(),
  isFeatured: z.boolean().optional().default(false),
  commentCount: z.number().int().nonnegative().default(0),
  likedCount: z.number().int().nonnegative().default(0),
  type: z.nativeEnum(PostType),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
});

export type Post = z.infer<typeof postSchema> & {
  topic?: Topic;
  author?: PublicUser;
  hasLiked?: boolean;
  hasSaved?: boolean;
};

export const postCondDTOSchema = z.object({
  str: z.string().optional(),
  userId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  isFeatured: z.preprocess((v) => v === "true", z.boolean()).optional(),
  type: z.nativeEnum(PostType).optional(),
});

export type PostCondDTO = z.infer<typeof postCondDTOSchema>;

export const createPostDTOSchema = z.object({
  content: z.string().min(1, { message: ERROR_MIN_CONTENT(1).message }),
  image: z.string().url({ message: ERROR_URL_INVALID.message }).optional(),
  authorId: z.string().uuid(),
  topicId: z.string().uuid(),
});

export type CreatePostDTO = z.infer<typeof createPostDTOSchema>;

export const updatePostDTOSchema = z
  .object({
    content: z
      .string()
      .min(1, { message: ERROR_MIN_CONTENT(1).message })
      .optional(),
    image: z.string().optional(),
    topicId: z.string().uuid().optional(),
    isFeatured: z.boolean().optional(),
    type: z.nativeEnum(PostType).optional(),
    commentCount: z.number().int().nonnegative(),
    likedCount: z.number().int().nonnegative(),
    updatedAt: z.date().optional(),
  })
  .partial();

export type UpdatePostDTO = z.infer<typeof updatePostDTOSchema>;