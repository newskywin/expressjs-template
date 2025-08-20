import { ITokenProvider, Requester, TokenPayload, UserRole } from "@shared/interfaces";
import { Paginated, PagingDTO } from "@shared/model/paging";

import bcrypt from 'bcryptjs';
import { v7 } from "uuid";
import { IUserRepository, IUserUseCase } from "../interfaces";
import { Status, User, UserCondDTO, userCondDTOSchema, UserLoginDTO, userLoginDTOSchema, UserRegistrationDTO, userRegistrationDTOSchema, UserUpdateDTO, userUpdateProfileDTOSchema } from "../model";

import { AppError, ERR_NOT_FOUND } from "@shared/ultils/error";
import { ERROR_INVALID_TOKEN, ERROR_INVALID_USERNAME_AND_PASSWORD, ERROR_USER_INACTIVATED, ERROR_USERNAME_EXISTED } from "../model/error";

export class UserUseCase implements IUserUseCase {
  constructor(private readonly repository: IUserRepository, readonly authenProvider: ITokenProvider) { }

  async profile(userId: string): Promise<User> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw ERR_NOT_FOUND;
    }

    return user;
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const payload = await this.authenProvider.verifyToken(token);

    if (!payload) {
      throw ERROR_INVALID_TOKEN;
    }

    const user = await this.repository.findById(payload.sub);
    if (!user) {
      throw ERR_NOT_FOUND;
    }

    if (user.status === Status.DELETED || user.status === Status.INACTIVE || user.status === Status.BANNED) {
      throw ERROR_USER_INACTIVATED;
    }

    return { sub: user.id, role: user.role };
  }

  async login(data: UserLoginDTO): Promise<string> {
    const dto = userLoginDTOSchema.parse(data);

    // 1. Find user with username from DTO
    const user = await this.repository.findByCond({ username: dto.username });
    if (!user) {
      throw ERROR_INVALID_USERNAME_AND_PASSWORD.withLog('Username not found');
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(`${dto.password}.${user.salt}`, user.password);
    if (!isMatch) {
      throw ERROR_INVALID_USERNAME_AND_PASSWORD.withLog('Password is incorrect');
    }

    if (user.status === Status.DELETED || user.status === Status.INACTIVE) {
      throw ERROR_USER_INACTIVATED;
    }

    // 3. Return token
    const role = user.role;
    const token = this.authenProvider.generateToken({ sub: user.id, role });
    return token;
  }

  async register(data: UserRegistrationDTO): Promise<string> {
    const dto = userRegistrationDTOSchema.parse(data);

    // 1. Check username existed
    const existedUser = await this.repository.findByCond({ username: dto.username });
    if (existedUser) {
      throw ERROR_USERNAME_EXISTED;
    }

    // 2. Gen salt and hash password
    // const salt = generateRandomString(20);
    const salt = bcrypt.genSaltSync(8);
    const hashPassword = await bcrypt.hash(`${dto.password}.${salt}`, 10);

    // 3. Create new user
    const newId = v7();
    const newUser: User = {
      ...dto,
      password: hashPassword,
      id: newId,
      status: Status.ACTIVE,
      salt: salt,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      followerCount: 0,
      postCount: 0,
    };

    // 4. Insert new user to database
    await this.repository.insert(newUser);

    return newId;
  }

  async updateProfile(requester: Requester, data: UserUpdateDTO): Promise<boolean> {
    const dto = userUpdateProfileDTOSchema.parse(data);

    const user = await this.repository.findById(requester.sub);
    if (!user || user.status === Status.DELETED || user.status === Status.BANNED) {
      throw ERR_NOT_FOUND;
    }

    if (dto.password) {
      const salt = bcrypt.genSaltSync(8);
      const hashPassword = await bcrypt.hash(`${dto.password}.${salt}`, 10);
      dto.salt = salt;
      dto.password = hashPassword;
    }

    await this.repository.update(requester.sub, dto);

    return true;
  }
  async listByIds(ids: string[]): Promise<User[]> {
    const users = await this.repository.listByIds(ids);

    return users.map(user => {
      const { password, salt, ...rest } = user;
      return rest as User;
    });
  }
  async delete(id: string): Promise<boolean> {
    const data = await this.repository.findById(id);

    if (!data || data.status === Status.DELETED) {
      throw ERR_NOT_FOUND;
    }

    await this.repository.delete(id, false);

    return true;
  }

  async getDetail(id: string): Promise<User | null> {
    const data = await this.repository.findById(id);

    if (!data || data.status === Status.DELETED) {
      throw ERR_NOT_FOUND;
    }

    return data;
  }
  async list(condition: UserCondDTO, paging: PagingDTO): Promise<Paginated<User>> {
    const dto = userCondDTOSchema.parse(condition);
    return await this.repository.list(dto, paging);
  }
}