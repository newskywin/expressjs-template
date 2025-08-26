import { AppEvent } from "@shared/model/event";
import { PublicUser } from "@shared/model/public-user";
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
  eventPublisher: IEventPublisher;
};

export interface IAuthorRpc {
  findById(id: string): Promise<PublicUser | null>;
  findByIds(ids: Array<string>): Promise<Array<PublicUser>>;
}

export type EventHandler = (msg: string) => void;

export interface IEventPublisher {
  publish<T>(event: AppEvent<T>): Promise<void>;
}