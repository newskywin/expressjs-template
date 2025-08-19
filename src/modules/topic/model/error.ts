import { AppError } from "@shared/ultils/error";

export const ERROR_TOPIC_NOT_FOUND = AppError.from(new Error("Topic not found"), 404);
export const ERROR_TOPIC_NAME_INVALID = AppError.from(new Error("Topic name is invalid, must be at least 3 characters"), 400);
export const ERROR_TOPIC_NAME_ALREADY_EXISTS = AppError.from(new Error("Topic name already exists"), 400);
export const ERROR_TOPIC_COLOR_INVALID = AppError.from(new Error("Topic color is invalid, must be a valid hex color code"), 400);