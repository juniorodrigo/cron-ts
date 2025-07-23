import type { JobConfig } from '../../types/global.js';

const config: JobConfig = {
	name: 'example-cleanup',
	cronExpression: '0 2 * * *', // Todos los días a las 2:00 AM
	timezone: 'America/Mexico_City',
	enabled: true,
	runOnInit: false,
	maxRetries: 3,
	retryDelay: 5000,
	callback: {
		onSuccess: async (result, context) => {
			console.log(`✅ Cleanup completado: ${result.message}`);
		},
		onError: async (error, context) => {
			console.error(`❌ Error en cleanup: ${error.message}`);
		},
		onComplete: async (result, context) => {
			console.log(`🏁 Cleanup finalizado en ${result.executionTime}ms`);
		},
	},
	metadata: {
		description: 'Limpia archivos temporales antiguos',
		author: 'Sistema Cron',
		version: '1.0.0',
	},
};

export default config;
