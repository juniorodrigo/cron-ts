import type { JobFunction, JobExecutionContext, JobResult } from '../../types/global.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const execute: JobFunction = async (context: JobExecutionContext): Promise<JobResult> => {
	try {
		const today = new Date();
		const reportDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

		// Simular recopilación de datos
		const reportData = {
			date: reportDate,
			timestamp: today.toISOString(),
			timezone: context.timezone,
			metrics: {
				totalJobs: Math.floor(Math.random() * 50) + 10,
				successfulJobs: Math.floor(Math.random() * 45) + 8,
				failedJobs: Math.floor(Math.random() * 5),
				avgExecutionTime: Math.floor(Math.random() * 5000) + 500,
			},
			systemInfo: {
				nodeVersion: process.version,
				platform: process.platform,
				uptime: process.uptime(),
				memoryUsage: process.memoryUsage(),
			},
			generatedBy: context.jobName,
			generatedAt: context.startTime,
		};

		// Generar reporte en formato JSON
		const reportContent = JSON.stringify(reportData, null, 2);
		const reportFileName = `daily-report-${reportDate}.json`;
		const reportPath = join('./reports', reportFileName);

		// Crear directorio si no existe (en un caso real usarías mkdirSync con recursive)
		try {
			writeFileSync(reportPath, reportContent, 'utf8');
		} catch (error) {
			// Si falla, intentar escribir en el directorio actual
			const fallbackPath = join('.', reportFileName);
			writeFileSync(fallbackPath, reportContent, 'utf8');
		}

		return {
			success: true,
			message: `Reporte diario generado exitosamente para ${reportDate}`,
			data: {
				reportPath,
				reportDate,
				metricsCount: Object.keys(reportData.metrics).length,
				fileSize: Buffer.byteLength(reportContent, 'utf8'),
			},
			executionTime: 0,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
			message: 'Error generando el reporte diario',
			executionTime: 0,
		};
	}
};

export default execute;
