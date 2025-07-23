import type { JobConfig } from '../types/global.js';

const config: JobConfig = {
	name: 'my-job-name',
	id: 'my-job', // ID único para ejecución manual (opcional, default: name)
	cronExpression: '0 9 * * 1-5', // Lunes a viernes a las 9:00 AM
	timezone: 'America/Mexico_City',
	enabled: true,
	runOnInit: false, // Ejecutar inmediatamente al iniciar el sistema
	maxRetries: 3,
	retryDelay: 5000, // 5 segundos
	callback: {
		onSuccess: async (result, context) => {
			console.log(`✅ ${context.jobName} completado: ${result.message}`);
		},
		onError: async (error, context) => {
			console.error(`❌ Error en ${context.jobName}: ${error.message}`);
			// Aquí puedes enviar notificaciones, emails, etc.
		},
		onComplete: async (result, context) => {
			console.log(`🏁 ${context.jobName} finalizado en ${result.executionTime}ms`);
		},
	},
	metadata: {
		description: 'Descripción de lo que hace este job',
		author: 'Tu Nombre',
		version: '1.0.0',
		tags: ['ejemplo', 'procesamiento'],
	},
};

export default config;
