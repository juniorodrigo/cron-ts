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

			const loadedJobs: JobConfig[] = [];

			for (const jobDir of jobDirs) {
				try {
					const jobConfig = await this.loadJob(jobDir);
					if (jobConfig) {
						loadedJobs.push(jobConfig);
					}
				} catch (error) {
					loaderLogger.error(
						`Error cargando job desde directorio: ${jobDir}`,
						error instanceof Error ? error : new Error(String(error))
					);
				}
			}

			// Validar IDs únicos
			this.validateUniqueIds(loadedJobs);

			loaderLogger.info(`Cargados ${jobManager.getActiveJobsCount()} jobs exitosamente`);
		} catch (error) {
			loaderLogger.error('Error al cargar jobs', error instanceof Error ? error : new Error(String(error)));
			throw error;
		}
	}

	/**
	 * Carga un job específico desde su directorio
	 */
	private async loadJob(jobDir: string): Promise<JobConfig | null> {
		const configPath = join(this.jobsPath, jobDir, 'config.ts');
		const functionPath = join(this.jobsPath, jobDir, 'function.ts');

		try {
			// Verificar si existen ambos archivos
			statSync(configPath);
			statSync(functionPath);
		} catch {
			loaderLogger.warn(`No se encontraron config.ts y function.ts en directorio: ${jobDir}`);
			return null;
		}

		try {
			// Importar ambos módulos por separado
			const configModule = await this.importModule(configPath);
			const functionModule = await this.importModule(functionPath);

			// Crear el módulo completo del job
			const jobModule: JobModule = {
				config: configModule.default,
				execute: functionModule.default,
			};

			// Validar la estructura del módulo
			this.validateJobModule(jobModule, jobDir);

			// Registrar el job en el manager
			jobManager.register(jobModule.config, jobModule.execute);

			loaderLogger.info(`Cargado: ${jobModule.config.name}`);

			return jobModule.config;
		} catch (error) {
			loaderLogger.error(
				`Error cargando job desde directorio: ${jobDir}`,
				error instanceof Error ? error : new Error(String(error))
			);
			return null;
		}
	}

	/**
	 * Valida que no haya IDs duplicados
	 */
	private validateUniqueIds(jobs: JobConfig[]): void {
		const ids = new Set<string>();
		const duplicates: string[] = [];

		for (const job of jobs) {
			const id = job.id || job.name;
			if (ids.has(id)) {
				duplicates.push(id);
			} else {
				ids.add(id);
			}
		}

		if (duplicates.length > 0) {
			throw new Error(`IDs duplicados encontrados: ${duplicates.join(', ')}`);
		}
	}

	/**
	 * Importa dinámicamente un módulo
	 */
	private async importModule(filePath: string): Promise<any> {
		const fileUrl = pathToFileURL(filePath).href;
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
	getAvailableJobs(): Array<{ directory: string; hasJobFiles: boolean }> {
		const jobDirs = this.getJobDirectories();

		return jobDirs.map((dir) => {
			const configPath = join(this.jobsPath, dir, 'config.ts');
			const functionPath = join(this.jobsPath, dir, 'function.ts');
			let hasJobFiles = false;

			try {
				statSync(configPath);
				statSync(functionPath);
				hasJobFiles = true;
			} catch {
				// Los archivos no existen
			}

			return {
				directory: dir,
				hasJobFiles,
			};
		});
	}
}

// Instancia singleton del loader
export const jobLoader = new JobLoader();
