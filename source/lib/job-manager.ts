import cron from 'node-cron';
import type { JobConfig, JobFunction, JobExecutionContext, JobResult } from '../types/global.js';
import { jobLogger, logger } from './logger.js';
import { env } from '../config/env.js';

export class JobManager {
	private jobs: Map<string, { config: JobConfig; task: cron.ScheduledTask; func: JobFunction }> = new Map();

	constructor() {
		process.on('SIGINT', () => this.gracefulShutdown());
		process.on('SIGTERM', () => this.gracefulShutdown());
	}

	/**
	 * Registra un nuevo job
	 */
	register(config: JobConfig, jobFunction: JobFunction): void {
		if (this.jobs.has(config.name)) {
			throw new Error(`Job '${config.name}' ya está registrado`);
		}

		if (!cron.validate(config.cronExpression)) {
			throw new Error(`Expresión cron inválida para job '${config.name}': ${config.cronExpression}`);
		}

		const task = cron.schedule(config.cronExpression, () => this.executeJob(config.name), {
			scheduled: false,
			timezone: config.timezone || env.timezone,
		});

		this.jobs.set(config.name, { config, task, func: jobFunction });

		jobLogger.registered(config.name, config.cronExpression, config.timezone || env.timezone);
	}

	/**
	 * Inicia un job específico
	 */
	start(jobName: string): void {
		const job = this.jobs.get(jobName);
		if (!job) {
			throw new Error(`Job '${jobName}' no encontrado`);
		}

		if (job.config.enabled === false) {
			jobLogger.warn(`Intentando iniciar job deshabilitado: ${jobName}`, jobName);
			return;
		}

		job.task.start();
		jobLogger.started(jobName);

		// Ejecutar inmediatamente si está configurado
		if (job.config.runOnInit) {
			setImmediate(() => this.executeJob(jobName));
		}
	}

	/**
	 * Detiene un job específico
	 */
	stop(jobName: string): void {
		const job = this.jobs.get(jobName);
		if (!job) {
			throw new Error(`Job '${jobName}' no encontrado`);
		}

		job.task.stop();
		jobLogger.warn(`Detenido: ${jobName}`, jobName);
	}

	/**
	 * Inicia todos los jobs habilitados
	 */
	startAll(): void {
		if (!env.jobsEnabled) {
			logger.warn('Jobs deshabilitados por configuración');
			return;
		}

		this.jobs.forEach((job, name) => {
			if (job.config.enabled !== false) {
				this.start(name);
			}
		});

		logger.success(`Sistema iniciado con ${this.getActiveJobsCount()} jobs activos`);
	}

	/**
	 * Detiene todos los jobs
	 */
	stopAll(): void {
		this.jobs.forEach((job, name) => {
			job.task.stop();
		});
		logger.warn('Todos los jobs han sido detenidos');
	}

	/**
	 * Ejecuta un job manualmente
	 */
	async executeJobManually(jobName: string): Promise<JobResult> {
		const job = this.jobs.get(jobName);
		if (!job) {
			throw new Error(`Job '${jobName}' no encontrado`);
		}

		return this.executeJob(jobName);
	}

	/**
	 * Obtiene información de todos los jobs
	 */
	getJobsInfo(): Array<{ name: string; config: JobConfig; isRunning: boolean }> {
		return Array.from(this.jobs.entries()).map(([name, job]) => ({
			name,
			config: job.config,
			isRunning: false, // Simplificado - los jobs muestran si están habilitados
		}));
	}

	/**
	 * Obtiene el número de jobs activos
	 */
	getActiveJobsCount(): number {
		return Array.from(this.jobs.values()).filter((job) => job.config.enabled !== false).length;
	}

	/**
	 * Ejecuta un job con manejo de errores y reintentos
	 */
	private async executeJob(jobName: string): Promise<JobResult> {
		const job = this.jobs.get(jobName);
		if (!job) {
			throw new Error(`Job '${jobName}' no encontrado`);
		}

		const context: JobExecutionContext = {
			jobName,
			startTime: new Date(),
			timezone: job.config.timezone || env.timezone,
			metadata: job.config.metadata,
		};

		const startTime = Date.now();
		let result: JobResult;

		jobLogger.info(`Ejecutando: ${jobName}`, jobName);

		try {
			// Ejecutar la función del job
			const jobResult = await job.func(context);

			result = {
				...jobResult,
				executionTime: Date.now() - startTime,
			};

			if (result.success) {
				jobLogger.completed(jobName, result.executionTime, result.message);

				// Ejecutar callback de éxito
				if (job.config.callback?.onSuccess) {
					await job.config.callback.onSuccess(result, context);
				}
			} else {
				jobLogger.failed(jobName, result.error!, result.executionTime);

				// Ejecutar callback de error
				if (job.config.callback?.onError && result.error) {
					await job.config.callback.onError(result.error, context);
				}
			}
		} catch (error) {
			result = {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				executionTime: Date.now() - startTime,
				message: `Error inesperado en job ${jobName}`,
			};

			jobLogger.failed(jobName, result.error!, result.executionTime);

			// Ejecutar callback de error
			if (job.config.callback?.onError) {
				try {
					await job.config.callback.onError(result.error!, context);
				} catch (callbackError) {
					jobLogger.error(
						`Error en callback de error para job: ${jobName}`,
						callbackError instanceof Error ? callbackError : new Error(String(callbackError)),
						jobName
					);
				}
			}
		}

		// Ejecutar callback de completado (siempre se ejecuta)
		if (job.config.callback?.onComplete) {
			try {
				await job.config.callback.onComplete(result, context);
			} catch (callbackError) {
				jobLogger.error(
					`Error en callback de completado para job: ${jobName}`,
					callbackError instanceof Error ? callbackError : new Error(String(callbackError)),
					jobName
				);
			}
		}

		return result;
	}

	/**
	 * Cierre controlado del sistema
	 */
	private gracefulShutdown(): void {
		logger.warn('Iniciando cierre controlado del sistema...');
		this.stopAll();
		process.exit(0);
	}
}

// Instancia singleton del manager
export const jobManager = new JobManager();
