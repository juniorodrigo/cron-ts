export interface JobExecutionContext {
	jobName: string;
	startTime: Date;
	timezone: string;
	metadata?: Record<string, any>;
}

export interface JobResult {
	success: boolean;
	message?: string;
	data?: any;
	error?: Error;
	executionTime: number;
}

export interface JobCallback {
	onSuccess?: (result: JobResult, context: JobExecutionContext) => void | Promise<void>;
	onError?: (error: Error, context: JobExecutionContext) => void | Promise<void>;
	onComplete?: (result: JobResult, context: JobExecutionContext) => void | Promise<void>;
}

export interface JobConfig {
	name: string;
	id?: string; // ID único para ejecución manual (opcional, default: name)
	cronExpression: string;
	timezone?: string;
	enabled?: boolean;
	runOnInit?: boolean;
	maxRetries?: number;
	retryDelay?: number;
	callback?: JobCallback;
	metadata?: Record<string, any>;
}

export type JobFunction = (context: JobExecutionContext) => Promise<JobResult> | JobResult;
