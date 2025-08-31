import { AppError } from "@shared/ultils/error";

export const ERROR_FIRST_NAME_AT_LEAST_2_CHARS = AppError.from(new Error('First name must be at least 2 characters'),400);
export const ERROR_LAST_NAME_AT_LEAST_2_CHARS = AppError.from(new Error('Last name must be at least 2 characters'),400);
export const ERROR_USERNAME_INVALID = AppError.from(new Error('Username must contain only letters, numbers and underscore (_)'),400);
export const ERROR_PASSWORD_AT_LEAST_6_CHARS = AppError.from(new Error('Password must be at least 6 characters'),400);
export const ERROR_BIRTHDAY_INVALID = AppError.from(new Error('Birthday is invalid'),400);
export const ERROR_GENDER_INVALID = AppError.from(new Error('Gender is invalid'),400);
export const ERROR_ROLE_INVALID = AppError.from(new Error('Role is invalid'),400);
export const ERROR_USERNAME_EXISTED = AppError.from(new Error('Username is already existed'),400);
export const ERROR_INVALID_USERNAME_AND_PASSWORD = AppError.from(new Error('Invalid username and password'),400);
export const ERROR_USER_INACTIVATED = AppError.from(new Error('User is inactivated or banned'),400);
export const ERROR_INVALID_TOKEN = AppError.from(new Error('Invalid token'),400);

// Account lockout errors
export const ERROR_ACCOUNT_LOCKED = AppError.from(new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.'), 429);
export const ERROR_MAX_LOGIN_ATTEMPTS = AppError.from(new Error('Maximum login attempts exceeded. Account will be locked.'), 429);

// Password policy errors
export const ERROR_PASSWORD_TOO_WEAK = AppError.from(new Error('Password does not meet security requirements'), 400);
export const ERROR_PASSWORD_RECENTLY_USED = AppError.from(new Error('Password was recently used. Please choose a different password.'), 400);