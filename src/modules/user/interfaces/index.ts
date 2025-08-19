import { Requester, TokenPayload } from "@shared/interfaces";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { User, UserCondDTO, UserLoginDTO, UserRegistrationDTO, UserUpdateDTO } from "../model";

export interface IUserUseCase {
  login(data: UserLoginDTO): Promise<string>;
  register(data: UserRegistrationDTO): Promise<string>;
  profile(userId: string): Promise<User>;
  updateProfile(requester: Requester, data: UserUpdateDTO): Promise<boolean>;

  verifyToken(token: string): Promise<TokenPayload>;
  delete(id: string): Promise<boolean>;
  listByIds(ids: string[]): Promise<User[]>;
  list(cond: UserCondDTO, paging: PagingDTO): Promise<Paginated<User>>;
}

export interface IUserRepository
  extends IUserQueryRepository,
  IUserCommandRepository {
  incrementCount(id: string, field: string, step: number): Promise<boolean>;
  decrementCount(id: string, field: string, step: number): Promise<boolean>;
}

export interface IUserCommandRepository {
  insert(data: User): Promise<boolean>;
  update(id: string, data: UserUpdateDTO): Promise<boolean>;
  delete(data: any, isHard: boolean): Promise<boolean>;
}
export interface IUserQueryRepository {
  findById(id: string): Promise<User | null>;
  findByCond(condition: UserCondDTO): Promise<User | null>;
  list(cond: UserCondDTO, paging: PagingDTO): Promise<Paginated<User>>;
  listByIds(ids: string[]): Promise<Array<User>>;
}