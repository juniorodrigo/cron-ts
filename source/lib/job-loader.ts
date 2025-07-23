import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { JobConfig, JobFunction } from '../types/global.js';
import { jobManager } from './job-manager.js';
import { loaderLogger } from './logger.js';

interface JobModule {
	config: JobConfig;
	execute: JobFunction;
}

export class JobLoader {
	private jobsPath: string;

	constructor(jobsPath: string = './source/jobs') {
		this.jobsPath = jobsPath;
	}

	/**
	 * Carga todos los jobs desde la carpeta Jobs
	 */
	async loadAllJobs(): Promise<void> {
		try {
			const jobDirs = this.getJobDirectories();

			loaderLogger.info(`Encontradas ${jobDirs.length} carpetas de jobs`);

			for (const jobDir of jobDirs) {
				try {
					await this.loadJob(jobDir);
				} catch (error) {
					loaderLogger.error(
						`Error cargando job desde directorio: ${jobDir}`,
						error instanceof Error ? error : new Error(String(error))
					);
				}
			}

			loaderLogger.info(`Cargados ${jobManager.getActiveJobsCount()} jobs exitosamente`);
		} catch (error) {
			loaderLogger.error('Error al cargar jobs', error instanceof Error ? error : new Error(String(error)));
			throw error;
		}
	}

	/**
	 * Carga un job específico desde su directorio
	 */
	private async loadJob(jobDir: string): Promise<void> {
		const jobPath = join(this.jobsPath, jobDir, 'job.ts');

		try {
			// Verificar si existe el archivo job.ts
			statSync(jobPath);
		} catch {
			loaderLogger.warn(`No se encontró job.ts en directorio: ${jobDir}`);
			return;
		}

		try {
			// Importar el módulo del job
			const jobModule = await this.importJobModule(jobPath);

			// Validar la estructura del módulo
			this.validateJobModule(jobModule, jobDir);

			// Registrar el job en el manager
			jobManager.register(jobModule.config, jobModule.execute);

			loaderLogger.info(`Cargado: ${jobModule.config.name}`);
		} catch (error) {
			loaderLogger.error(
				`Error cargando job desde: ${jobPath}`,
				error instanceof Error ? error : new Error(String(error))
			);
			throw error;
		}
	}

	/**
	 * Importa dinámicamente un módulo de job
	 */
	private async importJobModule(jobPath: string): Promise<JobModule> {
		const fileUrl = pathToFileURL(jobPath).href;
		const module = await import(fileUrl);
		return module;
	}

	/**
	 * Valida que el módulo del job tenga la estructura correcta
	 */
	private validateJobModule(module: any, jobDir: string): asserts module is JobModule {
		if (!module.config) {
			throw new Error(`Job en directorio '${jobDir}' no exporta 'config'`);
		}

		if (!module.execute || typeof module.execute !== 'function') {
			throw new Error(`Job en directorio '${jobDir}' no exporta función 'execute'`);
		}

		// Validar configuración básica
		if (!module.config.name || typeof module.config.name !== 'string') {
			throw new Error(`Job en directorio '${jobDir}' debe tener un nombre válido`);
		}

		if (!module.config.cronExpression || typeof module.config.cronExpression !== 'string') {
			throw new Error(`Job en directorio '${jobDir}' debe tener una expresión cron válida`);
		}
	}

	/**
	 * Obtiene la lista de directorios de jobs
	 */
	private getJobDirectories(): string[] {
		try {
			return readdirSync(this.jobsPath, { withFileTypes: true })
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name);
		} catch (error) {
			if ((error as any).code === 'ENOENT') {
				loaderLogger.warn(`Directorio de jobs no encontrado: ${this.jobsPath}`);
				return [];
			}
			throw error;
		}
	}

	/**
	 * Obtiene información de todos los jobs disponibles (cargados o no)
	 */
	getAvailableJobs(): Array<{ directory: string; hasJobFile: boolean }> {
		const jobDirs = this.getJobDirectories();

		return jobDirs.map((dir) => {
			const jobPath = join(this.jobsPath, dir, 'job.ts');
			let hasJobFile = false;

			try {
				statSync(jobPath);
				hasJobFile = true;
			} catch {
				// El archivo no existe
			}

			return {
				directory: dir,
				hasJobFile,
			};
		});
	}
}

// Instancia singleton del loader
export const jobLoader = new JobLoader();
