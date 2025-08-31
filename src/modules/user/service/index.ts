import { ITokenProvider, Requester, TokenPayload, UserRole, AuthTokenResponse } from "@shared/interfaces";
import { Paginated, PagingDTO } from "@shared/model/paging";

import bcrypt from 'bcryptjs';
import { v7 } from "uuid";
import { IUserRepository, IUserUseCase } from "../interfaces";
import { Status, User, UserCondDTO, userCondDTOSchema, UserLoginDTO, userLoginDTOSchema, UserRegistrationDTO, userRegistrationDTOSchema, UserUpdateDTO, userUpdateProfileDTOSchema } from "../model";

import { ERR_NOT_FOUND } from "@shared/ultils/error";
import { ERROR_INVALID_TOKEN, ERROR_INVALID_USERNAME_AND_PASSWORD, ERROR_USER_INACTIVATED, ERROR_USERNAME_EXISTED, ERROR_ACCOUNT_LOCKED, ERROR_MAX_LOGIN_ATTEMPTS, ERROR_PASSWORD_RECENTLY_USED } from "../model/error";
import { TokenBlacklistService } from "@shared/components/token-blacklist";
import { appConfig } from "@shared/components/config";

export class UserUseCase implements IUserUseCase {
  constructor(private readonly repository: IUserRepository, readonly authenProvider: ITokenProvider) { }

  private async isAccountLocked(user: User): Promise<boolean> {
    if (!user.lockUntil) return false;
    
    // Check if lock period has expired
    if (user.lockUntil <= new Date()) {
      // Reset login attempts and clear lock
      await this.repository.update(user.id, {
        loginAttempts: 0,
        lockUntil: null
      });
      return false;
    }
    
    return true;
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const attempts = (user.loginAttempts || 0) + 1;
    
    if (attempts >= appConfig.security.maxLoginAttempts) {
      // Lock the account
      const lockUntil = new Date(Date.now() + appConfig.security.accountLockTime);
      await this.repository.update(user.id, {
        loginAttempts: attempts,
        lockUntil: lockUntil
      });
      throw ERROR_MAX_LOGIN_ATTEMPTS;
    } else {
      // Increment login attempts
      await this.repository.update(user.id, {
        loginAttempts: attempts
      });
      throw ERROR_INVALID_USERNAME_AND_PASSWORD.withLog(`Failed login attempt ${attempts}/${appConfig.security.maxLoginAttempts}`);
    }
  }

  private async handleSuccessfulLogin(user: User): Promise<void> {
    // Reset login attempts and update last login time
    await this.repository.update(user.id, {
      loginAttempts: 0,
      lockUntil: null,
      lastLoginAt: new Date()
    });
  }

  private async validatePasswordStrength(password: string): Promise<boolean> {
    // Check minimum length
    if (password.length < appConfig.security.passwordMinLength) {
      return false;
    }
    
    // Check for required character types
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[@$!%*?&]/.test(password);
    
    return hasLowercase && hasUppercase && hasNumbers && hasSpecialChars;
  }

  private async isPasswordRecentlyUsed(userId: string, newPassword: string, salt: string): Promise<boolean> {
    if (!appConfig.security.passwordHistoryCheck) {
      return false;
    }
    
    // Get current user to check against current password
    const user = await this.repository.findById(userId);
    if (!user) return false;
    
    // Check if new password matches current password
    const isCurrentPassword = await bcrypt.compare(`${newPassword}.${user.salt}`, user.password);
    
    return isCurrentPassword;
  }

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

  async login(data: UserLoginDTO): Promise<AuthTokenResponse> {
    const dto = userLoginDTOSchema.parse(data);

    // 1. Find user with username from DTO
    const user = await this.repository.findByCond({ username: dto.username });
    if (!user) {
      throw ERROR_INVALID_USERNAME_AND_PASSWORD.withLog('Username not found');
    }

    // 2. Check if account is locked
    if (await this.isAccountLocked(user)) {
      throw ERROR_ACCOUNT_LOCKED;
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(`${dto.password}.${user.salt}`, user.password);
    if (!isMatch) {
      await this.handleFailedLogin(user);
      // The above method throws an error, so this line won't be reached
    }

    // 4. Check user status
    if (user.status === Status.DELETED || user.status === Status.INACTIVE) {
      throw ERROR_USER_INACTIVATED;
    }

    // 5. Handle successful login
    await this.handleSuccessfulLogin(user);

    // 6. Generate tokens
    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.authenProvider.generateToken(payload);
    const refreshToken = await this.authenProvider.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: (this.authenProvider as any).getAccessTokenExpiryInSeconds()
    };
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
      loginAttempts: 0,
      lockUntil: null,
      lastLoginAt: null,
    };

    // 4. Insert new user to database
    await this.repository.insert(newUser);

    return newId;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenResponse> {
    // 1. Verify refresh token
    const payload = await this.authenProvider.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw ERROR_INVALID_TOKEN.withMessage("Invalid refresh token");
    }

    // 2. Check if user still exists and is active
    const user = await this.repository.findById(payload.sub);
    if (!user || user.status === Status.DELETED || user.status === Status.INACTIVE || user.status === Status.BANNED) {
      throw ERROR_USER_INACTIVATED;
    }

    // 3. Generate new tokens
    const newPayload = { sub: user.id, role: user.role };
    const accessToken = await this.authenProvider.generateToken(newPayload);
    const newRefreshToken = await this.authenProvider.generateRefreshToken(newPayload);

    // 4. Blacklist old refresh token
    const blacklistService = new TokenBlacklistService();
    const refreshExpirySeconds = (this.authenProvider as any).getRefreshTokenExpiryInSeconds();
    await blacklistService.addToBlacklist(refreshToken, refreshExpirySeconds);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: (this.authenProvider as any).getAccessTokenExpiryInSeconds()
    };
  }

  async logout(accessToken: string, refreshToken: string): Promise<boolean> {
    const blacklistService = new TokenBlacklistService();
    
    // Blacklist both tokens
    const accessExpirySeconds = (this.authenProvider as any).getAccessTokenExpiryInSeconds();
    const refreshExpirySeconds = (this.authenProvider as any).getRefreshTokenExpiryInSeconds();
    
    await Promise.all([
      blacklistService.addToBlacklist(accessToken, accessExpirySeconds),
      blacklistService.addToBlacklist(refreshToken, refreshExpirySeconds)
    ]);

    return true;
  }

  async updateProfile(requester: Requester, data: UserUpdateDTO): Promise<boolean> {
    const dto = userUpdateProfileDTOSchema.parse(data);

    const user = await this.repository.findById(requester.sub);
    if (!user || user.status === Status.DELETED || user.status === Status.BANNED) {
      throw ERR_NOT_FOUND;
    }

    if (dto.password) {
      // Validate password strength using the schema (which will throw if invalid)
      // Additional custom validation can be added here if needed
      
      // Check if password was recently used
      const salt = bcrypt.genSaltSync(8);
      if (await this.isPasswordRecentlyUsed(requester.sub, dto.password, salt)) {
        throw ERROR_PASSWORD_RECENTLY_USED;
      }
      
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