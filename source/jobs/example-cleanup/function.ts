import type { JobFunction, JobExecutionContext, JobResult } from '../../types/global.js';
import { readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

const execute: JobFunction = async (context: JobExecutionContext): Promise<JobResult> => {
	try {
		const tempDir = './temp';
		const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
		const now = Date.now();

		let deletedFiles = 0;
		let totalSize = 0;

		try {
			const files = readdirSync(tempDir);

			for (const file of files) {
				const filePath = join(tempDir, file);

				try {
					const stats = statSync(filePath);
					const fileAge = now - stats.mtime.getTime();

					if (fileAge > maxAge) {
						totalSize += stats.size;
						unlinkSync(filePath);
						deletedFiles++;
					}
				} catch (fileError) {
					console.warn(`No se pudo procesar archivo: ${filePath}`, fileError);
				}
			}
		} catch (dirError) {
			// El directorio no existe, no es un error crítico
			if ((dirError as any).code !== 'ENOENT') {
				throw dirError;
			}
		}

		return {
			success: true,
			message: `Se eliminaron ${deletedFiles} archivos, liberando ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
			data: {
				deletedFiles,
				totalSizeBytes: totalSize,
				directory: tempDir,
				maxAgedays: 7,
			},
			executionTime: 0, // Se calculará automáticamente
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
			message: 'Error durante la limpieza de archivos temporales',
			executionTime: 0,
		};
	}
};

export default execute;
