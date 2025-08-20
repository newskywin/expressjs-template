import { Handler } from "express";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export interface Requester extends TokenPayload {}

export interface ITokenProvider {
  // generate access token
  generateToken(payload: TokenPayload): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload | null>;
}

export type TokenIntrospectResult = {
  payload: TokenPayload | null;
  error?: Error;
  isOk: boolean;
};
export interface ITokenIntrospect {
  introspect(token: string): Promise<TokenIntrospectResult>;
}

export interface MdlFactory {
  auth: Handler;
  optAuth: Handler;
  allowRoles: (roles: UserRole[]) => Handler;
}

export type ServiceContext = {
  mdlFactory: MdlFactory;
};