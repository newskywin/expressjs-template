import { ITokenProvider, ITokenBlacklist, TokenPayload } from "@shared/interfaces";

import jwt, { SignOptions } from "jsonwebtoken";

export class JwtTokenService implements ITokenProvider {
  private readonly secretKey: string;
  private readonly refreshSecretKey: string;
  private readonly accessTokenExpiresIn: string | number;
  private readonly refreshTokenExpiresIn: string | number;
  private readonly blacklistService: ITokenBlacklist;

  constructor(
    secretKey: string, 
    accessTokenExpiresIn: string | number = "15m",
    refreshTokenExpiresIn: string | number = "7d",
    blacklistService: ITokenBlacklist
  ) {
    this.secretKey = secretKey;
    this.refreshSecretKey = secretKey + "_refresh";
    this.accessTokenExpiresIn = accessTokenExpiresIn;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
    this.blacklistService = blacklistService;
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    const options: SignOptions = { expiresIn: this.accessTokenExpiresIn as SignOptions["expiresIn"] };
    return jwt.sign(payload, this.secretKey, options);
  }

  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    const options: SignOptions = { expiresIn: this.refreshTokenExpiresIn as SignOptions["expiresIn"] };
    return jwt.sign(payload, this.refreshSecretKey, options);
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.blacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        return null;
      }

      const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.blacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        return null;
      }

      const decoded = jwt.verify(token, this.refreshSecretKey) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  getAccessTokenExpiryInSeconds(): number {
    // Convert expiry to seconds for blacklist TTL
    if (typeof this.accessTokenExpiresIn === 'string') {
      // Simple conversion for common formats like "15m", "1h", "7d"
      const match = this.accessTokenExpiresIn.match(/^(\d+)([smhd])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
          case 's': return value;
          case 'm': return value * 60;
          case 'h': return value * 3600;
          case 'd': return value * 86400;
        }
      }
    }
    return 900; // Default 15 minutes
  }

  getRefreshTokenExpiryInSeconds(): number {
    // Convert expiry to seconds for blacklist TTL
    if (typeof this.refreshTokenExpiresIn === 'string') {
      // Simple conversion for common formats like "15m", "1h", "7d"
      const match = this.refreshTokenExpiresIn.match(/^(\d+)([smhd])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
          case 's': return value;
          case 'm': return value * 60;
          case 'h': return value * 3600;
          case 'd': return value * 86400;
        }
      }
    }
    return 604800; // Default 7 days
  }
}
