import type { JobFunction, JobExecutionContext, JobResult } from '../types/global.js';

const execute: JobFunction = async (context: JobExecutionContext): Promise<JobResult> => {
	try {
		// Tu lógica aquí
		console.log(`Ejecutando job: ${context.jobName} a las ${context.startTime}`);

		// Ejemplo: Simular trabajo asíncrono
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Ejemplo: Procesar datos
		const processedItems = Math.floor(Math.random() * 100);

		return {
			success: true,
			message: `Job ejecutado exitosamente`,
			data: {
				processedItems,
				timestamp: new Date().toISOString(),
				jobName: context.jobName,
			},
			executionTime: 0, // Se calcula automáticamente
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
			message: 'Error ejecutando el job',
			executionTime: 0,
		};
	}
};

export default execute;
