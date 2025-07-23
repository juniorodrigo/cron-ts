import { jobLoader } from '../lib/job-loader.js';
import { jobManager } from '../lib/job-manager.js';
import { logger } from '../lib/logger.js';

async function runJob() {
	try {
		// Obtener el ID del job desde argumentos de línea de comandos
		const args = process.argv.slice(2);

		if (args.length === 0) {
			logger.warn('Uso: pnpm job:run <job-id>');
			logger.info('Ejemplo: pnpm job:run daily-report');
			process.exit(1);
		}

		const jobId = args[0];

		logger.header(`EJECUCIÓN MANUAL DE JOB: ${jobId}`);

		// Cargar todos los jobs primero
		logger.info('Cargando jobs...');
		await jobLoader.loadAllJobs();

		// Verificar que el job existe
		const job = jobManager.findJobById(jobId);
		if (!job) {
			// Mostrar jobs disponibles
			const jobsInfo = jobManager.getJobsInfo();
			logger.error(`Job '${jobId}' no encontrado`);

			if (jobsInfo.length > 0) {
				logger.subheader('Jobs disponibles:');
				const availableTable = jobsInfo.map((job) => [
					job.config.id || job.config.name,
					job.config.name,
					job.config.metadata?.description || 'No description',
				]);
				logger.table(['ID', 'Name', 'Description'], availableTable);
			}

			process.exit(1);
		}

		// Ejecutar el job
		logger.info(`Ejecutando job: ${job.config.name}`);
		logger.subheader(
			`ID: ${job.config.id || job.config.name} | Descripción: ${job.config.metadata?.description || 'No description'}`
		);

		const result = await jobManager.executeJobById(jobId);

		// Mostrar resultado
		if (result.success) {
			logger.success(`Job completado exitosamente en ${result.executionTime}ms`);
			if (result.message) {
				logger.info(`Mensaje: ${result.message}`);
			}
			if (result.data) {
				logger.subheader('Datos del resultado:');
				console.log(JSON.stringify(result.data, null, 2));
			}
		} else {
			logger.error(`Job falló: ${result.message}`, result.error);
			process.exit(1);
		}
	} catch (error) {
		logger.error('Error ejecutando job', error instanceof Error ? error : new Error(String(error)));
		process.exit(1);
	}
}

runJob();
