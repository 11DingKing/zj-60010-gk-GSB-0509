import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>("REDIS_URL");
      this.client = new Redis(redisUrl, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        this.logger.log("Redis connected successfully");
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.client.on("close", () => {
        this.isConnected = false;
        this.logger.warn("Redis connection closed");
      });
    } catch (err) {
      this.logger.error(
        `Failed to initialize Redis: ${(err as Error).message}`,
      );
      this.isConnected = false;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  private checkConnection(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Redis | null {
    return this.checkConnection() ? this.client : null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.checkConnection()) {
      return null;
    }
    try {
      return await this.client!.get(key);
    } catch (err) {
      this.logger.warn(
        `Redis get failed for key ${key}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.checkConnection()) {
      return false;
    }
    try {
      if (ttl) {
        await this.client!.setex(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Redis set failed for key ${key}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.checkConnection()) {
      return false;
    }
    try {
      await this.client!.del(key);
      return true;
    } catch (err) {
      this.logger.warn(
        `Redis del failed for key ${key}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (err) {
      this.logger.warn(
        `Failed to parse JSON for key ${key}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const jsonStr = JSON.stringify(value);
      return await this.set(key, jsonStr, ttl);
    } catch (err) {
      this.logger.warn(
        `Failed to stringify JSON for key ${key}: ${(err as Error).message}`,
      );
      return false;
    }
  }
}
