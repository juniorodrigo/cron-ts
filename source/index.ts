import { env } from './config/env.js';
import { jobLoader } from './lib/job-loader.js';
import { jobManager } from './lib/job-manager.js';
import { logger } from './lib/logger.js';

async function main() {
	try {
		logger.header('🚀 CRON JOBS SYSTEM');

		// Validate configuration
		if (!env.jobsEnabled) {
			logger.warn('Jobs deshabilitados por configuración');
			process.exit(0);
		}

		// Cargar todos los jobs
		logger.info('Cargando jobs...');
		await jobLoader.loadAllJobs();

		// Obtener información de jobs cargados
		const jobsInfo = jobManager.getJobsInfo();
		const enabledJobs = jobsInfo.filter((job) => job.config.enabled !== false);

		if (enabledJobs.length === 0) {
			logger.warn('No se encontraron jobs habilitados');
			process.exit(0);
		}

		// Iniciar todos los jobs
		jobManager.startAll();

		// Mostrar resumen final
		logger.subheader(`Sistema configurado | Zona horaria: ${env.timezone} | Logs: ${env.logDir}`);

		// Mantener el proceso activo
		process.on('SIGINT', () => {
			logger.warn('Señal de interrupción recibida, cerrando sistema...');
		});

		process.on('SIGTERM', () => {
			logger.warn('Señal de terminación recibida, cerrando sistema...');
		});
	} catch (error) {
		logger.error('Error crítico iniciando el sistema', error instanceof Error ? error : new Error(String(error)));
		process.exit(1);
	}
}

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
	logger.error('Error no capturado', error);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Promesa rechazada no manejada', reason instanceof Error ? reason : new Error(String(reason)));
	process.exit(1);
});

// Iniciar aplicación
main();
