import { ITokenProvider, TokenPayload } from "@shared/interfaces";

import jwt, { SignOptions } from "jsonwebtoken";

export class JwtTokenService implements ITokenProvider {
  private readonly secretKey: string;
  private readonly expiresIn: SignOptions["expiresIn"];

  constructor(secretKey: string, expiresIn: SignOptions["expiresIn"]) {
    this.secretKey = secretKey;
    this.expiresIn = expiresIn;
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    // const payload = { userId };
    const options: SignOptions = { expiresIn: this.expiresIn };
    return jwt.sign(payload, this.secretKey, options);
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
