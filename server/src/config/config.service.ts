
import dotenv from 'dotenv'
import { z } from 'zod'
import path from 'path';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  REDIS_URL: z.string().url().optional(),
  REFRESH_SECRET: z.string().min(10).optional(),
  REDIS_REST_TOKEN: z.string().optional(),
})

type EnvVars = z.infer<typeof schema>

export class ConfigService {
  private readonly env: EnvVars

  constructor() {
    const parsed = schema.safeParse(process.env)
    if (!parsed.success) {
      console.error('❌ Invalid environment configuration', parsed.error.flatten().fieldErrors)
      process.exit(1)
    }
    this.env = parsed.data
  }

  get isProd(): boolean {
    return this.env.NODE_ENV === 'production'
  }

  get isDev(): boolean {
    return this.env.NODE_ENV === 'development'
  }

  get port(): number {
    return this.env.PORT
  }

  get dbUrl(): string {
    return this.env.DATABASE_URL
  }

  get jwtSecret(): string {
    return this.env.JWT_SECRET
  }

  get redisUrl(): string | undefined {
    return this.env.REDIS_URL
  }
  get refreshSecret(): string {
    return this.env.REFRESH_SECRET || this.env.JWT_SECRET
  }
  get redisToken(): string | undefined{
    return this.env.REDIS_REST_TOKEN 
  }


  // Add more computed properties or methods if needed
}

export const config = new ConfigService()
