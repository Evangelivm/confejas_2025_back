import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.client = createClient({
      url: `redis://${redisHost}:${redisPort}`,
    });
    this.client.connect();
  }

  getClient() {
    return this.client;
  }

  async publish(channel: string, message: string) {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, listener: (message: string) => void) {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, listener);
  }

  // Métodos para manejar Hashes
  async setHash(key: string, field: string, value: string) {
    await this.client.hSet(key, field, value);
  }

  async getHashField(key: string, field: string): Promise<string | null> {
    const value = await this.client.hGet(key, field);
    console.log(value);
    return value;
  }
}
