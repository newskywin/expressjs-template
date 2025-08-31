import { UserRole } from "@shared/interfaces";
import { z } from "zod";
import { ERROR_FIRST_NAME_AT_LEAST_2_CHARS, ERROR_LAST_NAME_AT_LEAST_2_CHARS, ERROR_PASSWORD_AT_LEAST_6_CHARS, ERROR_ROLE_INVALID, ERROR_USERNAME_INVALID } from "./error";

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum Status {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  DELETED = 'deleted',
}


// Enhanced password validation with stronger security requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "Password must contain at least one number")
  .regex(/^(?=.*[@$!%*?&])/, "Password must contain at least one special character (@$!%*?&)");

export const userSchema = z.object({
  id: z.string().uuid(),
  avatar: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  firstName: z.string().min(2, ERROR_FIRST_NAME_AT_LEAST_2_CHARS.message),
  lastName: z.string().min(2, ERROR_LAST_NAME_AT_LEAST_2_CHARS.message),
  username: z
    .string()
    .min(3, "Username must not be less than 3 characters")
    .max(25, "Username must not be greater than 25 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      ERROR_USERNAME_INVALID.message,
    ),
  password: passwordSchema,
  salt: z.string().min(8),
  bio: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  followerCount: z.number().default(0),
  postCount: z.number().default(0),
  role: z.nativeEnum(UserRole, ERROR_ROLE_INVALID.message),
  status: z.nativeEnum(Status).optional(),
  loginAttempts: z.number().default(0),
  lockUntil: z.date().nullable().optional(),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const userRegistrationDTOSchema = userSchema.pick({
  firstName: true,
  lastName: true,
  username: true,
  password: true,
}).required();

export const userLoginDTOSchema = userSchema.pick({
  username: true,
  password: true,
}).required();

export type UserRegistrationDTO = z.infer<typeof userRegistrationDTOSchema>;
export type UserLoginDTO = z.infer<typeof userLoginDTOSchema>;

export const userUpdateDTOSchema = userSchema.pick({
  avatar: true,
  cover: true,
  firstName: true,
  lastName: true,
  bio: true,
  websiteUrl: true,
  salt: true,
  role: true,
  status: true,
  loginAttempts: true,
  lockUntil: true,
  lastLoginAt: true,
}).extend({
  password: passwordSchema.optional(),
}).partial();

export type UserUpdateDTO = z.infer<typeof userUpdateDTOSchema>;

// Don't allow update role and status
export const userUpdateProfileDTOSchema = userUpdateDTOSchema.omit({
  role: true,
  status: true,
}).partial();

export const userCondDTOSchema = userSchema.pick({
  firstName: true,
  lastName: true,
  username: true,
  role: true,
  status: true,
}).partial();

export type UserCondDTO = z.infer<typeof userCondDTOSchema>;
export type UserUpdateProfileDTO = z.infer<typeof userUpdateProfileDTOSchema>;