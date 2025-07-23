import type { JobConfig } from '../../types/global.js';

const config: JobConfig = {
	name: 'daily-report',
	id: 'report',
	cronExpression: '0 9 * * 1-5', // Lunes a viernes a las 9:00 AM
	timezone: 'America/Mexico_City',
	enabled: true,
	runOnInit: false,
	callback: {
		onSuccess: async (result, context) => {
			console.log(`📊 Reporte diario generado: ${result.data?.reportPath}`);
		},
		onError: async (error, context) => {
			console.error(`📊❌ Error generando reporte: ${error.message}`);
			// Aquí podrías enviar una notificación por email, Slack, etc.
		},
	},
	metadata: {
		description: 'Genera reporte diario de actividades del sistema',
		author: 'Sistema Cron',
		version: '1.0.0',
		tags: ['reports', 'daily', 'analytics'],
	},
};

export default config;
