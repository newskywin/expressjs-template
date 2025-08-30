import { ITokenBlacklist } from "@shared/interfaces";
import { RedisClient } from "./redis";

export class TokenBlacklistService implements ITokenBlacklist {
  private readonly prefix = "blacklist:token:";

  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    const key = this.prefix + token;
    const client = RedisClient.getInstance().getClient();
    await client.setEx(key, expiresIn, "1");
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.prefix + token;
    const client = RedisClient.getInstance().getClient();
    const result = await client.get(key);
    return result === "1";
  }
}
