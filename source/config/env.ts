import * as dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
	TIMEZONE: z.string().default('America/Mexico_City'),
	JOBS_ENABLED: z
		.string()
		.transform((val) => val === 'true')
		.default('true'),
	LOG_DIR: z.string().default('./logs'),
});

const _env = envSchema.parse(process.env);

export const env = {
	nodeEnv: _env.NODE_ENV,
	logLevel: _env.LOG_LEVEL,
	timezone: _env.TIMEZONE,
	jobsEnabled: _env.JOBS_ENABLED,
	logDir: _env.LOG_DIR,
};
