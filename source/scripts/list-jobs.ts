import { jobLoader } from '../lib/job-loader.js';
import { jobManager } from '../lib/job-manager.js';
import { logger } from '../lib/logger.js';

async function listJobs() {
	try {
		logger.header('LISTADO DE JOBS');

		// Obtener jobs disponibles en el directorio
		const availableJobs = jobLoader.getAvailableJobs();

		if (availableJobs.length === 0) {
			logger.warn('No se encontraron directorios de jobs en ./source/jobs/');
			return;
		}

		// Tabla de archivos encontrados
		logger.subheader('Archivos encontrados:');
		const filesTable = availableJobs.map((job) => [
			job.directory,
			job.hasJobFiles ? '✓ Present' : '✗ Missing',
			job.hasJobFiles ? 'Ready' : 'Not Ready',
		]);

		logger.table(['Job Directory', 'config.ts + function.ts', 'Status'], filesTable);

		// Si hay jobs válidos, mostrar detalles
		const validJobs = availableJobs.filter((job) => job.hasJobFiles);

		if (validJobs.length > 0) {
			logger.subheader('Configuración de jobs:');

			try {
				await jobLoader.loadAllJobs();
				const jobsInfo = jobManager.getJobsInfo();

				// Tabla principal de configuración
				const configTable = jobsInfo.map((job) => [
					job.config.id || job.config.name,
					job.config.name,
					job.config.cronExpression,
					job.config.timezone || 'Default',
					job.config.enabled !== false ? 'Enabled' : 'Disabled',
					job.config.metadata?.description || 'No description',
				]);

				logger.table(['ID', 'Job Name', 'Schedule', 'Timezone', 'Status', 'Description'], configTable);

				// Tabla de configuración adicional si hay datos relevantes
				const additionalConfigJobs = jobsInfo.filter(
					(job) => job.config.runOnInit || job.config.maxRetries || job.config.retryDelay
				);

				if (additionalConfigJobs.length > 0) {
					logger.subheader('Configuración avanzada:');
					const advancedTable = additionalConfigJobs.map((job) => [
						job.config.id || job.config.name,
						job.config.name,
						job.config.runOnInit ? 'Yes' : 'No',
						job.config.maxRetries?.toString() || 'Default',
						job.config.retryDelay ? `${job.config.retryDelay}ms` : 'Default',
					]);

					logger.table(['ID', 'Job Name', 'Run on Init', 'Max Retries', 'Retry Delay'], advancedTable);
				}

				// Resumen
				const totalJobs = jobsInfo.length;
				const enabledJobs = jobsInfo.filter((job) => job.config.enabled !== false).length;
				const disabledJobs = totalJobs - enabledJobs;

				logger.subheader('Resumen:');
				const summaryTable = [
					['Total Jobs', totalJobs.toString()],
					['Enabled', enabledJobs.toString()],
					['Disabled', disabledJobs.toString()],
					['Ready to Run', validJobs.length.toString()],
				];

				logger.table(['Metric', 'Count'], summaryTable);
			} catch (error) {
				logger.error('Error cargando configuración de jobs', error instanceof Error ? error : new Error(String(error)));
			}
		} else {
			logger.warn('No hay jobs válidos para mostrar configuración');
		}
	} catch (error) {
		logger.error('Error listando jobs', error instanceof Error ? error : new Error(String(error)));
		process.exit(1);
	}
}

listJobs();
