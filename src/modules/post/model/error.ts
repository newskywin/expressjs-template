import { AppError } from "@shared/ultils/error";

export const ERROR_POST_NOT_FOUND = AppError.from(new Error("Post not found"),404);
export const ERROR_AUTHOR_NOT_FOUND = AppError.from(new Error("Author not found"),404);

export const ERROR_MIN_CONTENT = (num: number) =>
  AppError.from(new Error(`The content must be at least ${num} characters`),400);
export const ERROR_URL_INVALID = AppError.from(new Error("Invalid URL"),400);

export const ERROR_TOPIC_NOT_FOUND = AppError.from(new Error("Topic not found"),404);
export const ERROR_TOPIC_NAME_INVALID = AppError.from(new Error(
  "Topic name is invalid, must be at least 3 characters"
),400);
export const ERROR_TOPIC_NAME_ALREADY_EXISTS = AppError.from(new Error("Topic name already exists"),400);
export const ERROR_TOPIC_COLOR_INVALID = AppError.from(new Error(
  "Topic color is invalid, must be a valid hex color code"
),400);