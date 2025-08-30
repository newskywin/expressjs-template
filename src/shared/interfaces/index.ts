import { AppEvent } from "@shared/model/event";
import { PublicUser } from "@shared/model/public-user";
import { Handler } from "express";

export * from "./cache";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export interface Requester extends TokenPayload {}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenProvider {
  // generate access token
  generateToken(payload: TokenPayload): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload | null>;
  generateRefreshToken(payload: TokenPayload): Promise<string>;
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;
}

export interface ITokenBlacklist {
  addToBlacklist(token: string, expiresIn: number): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
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
  subscribe(eventName: string, handler: EventHandler): Promise<void>;
  disconnect(): Promise<void>;
}

export interface IEventSubscriber {
  subscribe(eventName: string, handler: EventHandler): Promise<void>;
  unsubscribe(eventName: string): Promise<void>;
  disconnect(): Promise<void>;
}