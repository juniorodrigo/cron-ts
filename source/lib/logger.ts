import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import signale from 'signale';
import { env } from '../config/env.js';

// Configuración más limpia de Signale
const signaleConfig = {
	displayScope: false,
	displayBadge: true,
	displayDate: false,
	displayFilename: false,
	displayLabel: false,
	displayTimestamp: false,
	underlineLabel: false,
	underlineMessage: false,
	underlinePrefix: false,
	uppercaseLabel: false,
};

// Logger principal más limpio
const { Signale } = signale;
const consoleLogger = new Signale({
	...signaleConfig,
	types: {
		info: {
			badge: '•',
			color: 'blue',
			label: '',
		},
		success: {
			badge: '✓',
			color: 'green',
			label: '',
		},
		warn: {
			badge: '!',
			color: 'yellow',
			label: '',
		},
		error: {
			badge: '✗',
			color: 'red',
			label: '',
		},
		debug: {
			badge: '·',
			color: 'gray',
			label: '',
		},
		header: {
			badge: '',
			color: 'cyan',
			label: '',
		},
		subheader: {
			badge: '─',
			color: 'gray',
			label: '',
		},
	},
});

// Configuración de Winston para archivos (sin cambios)
const fileFormat = winston.format.combine(
	winston.format.timestamp({
		format: 'YYYY-MM-DD HH:mm:ss',
	}),
	winston.format.errors({ stack: true }),
	winston.format.printf(({ timestamp, level, message, stack, jobName, scope, ...meta }) => {
		const scopeLabel = scope ? `[${scope}]` : '';
		const jobLabel = jobName ? `[${jobName}]` : '';
		const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
		return `${timestamp} [${level.toUpperCase()}] ${scopeLabel}${jobLabel} ${message}${
			stack ? `\n${stack}` : ''
		}${metaStr}`;
	})
);

const fileTransports: winston.transport[] = [
	new DailyRotateFile({
		filename: `${env.logDir}/app-%DATE%.log`,
		datePattern: 'YYYY-MM-DD',
		maxSize: '20m',
		maxFiles: '14d',
		level: 'info',
		format: fileFormat,
	}),
	new DailyRotateFile({
		filename: `${env.logDir}/error-%DATE%.log`,
		datePattern: 'YYYY-MM-DD',
		maxSize: '20m',
		maxFiles: '30d',
		level: 'error',
		format: fileFormat,
	}),
	new DailyRotateFile({
		filename: `${env.logDir}/jobs-%DATE%.log`,
		datePattern: 'YYYY-MM-DD',
		maxSize: '20m',
		maxFiles: '30d',
		level: 'info',
		format: fileFormat,
	}),
];

const fileLogger = winston.createLogger({
	level: env.logLevel,
	transports: fileTransports,
	exceptionHandlers: [
		new DailyRotateFile({
			filename: `${env.logDir}/exceptions-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			maxSize: '20m',
			maxFiles: '30d',
			format: fileFormat,
		}),
	],
	rejectionHandlers: [
		new DailyRotateFile({
			filename: `${env.logDir}/rejections-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			maxSize: '20m',
			maxFiles: '30d',
			format: fileFormat,
		}),
	],
});

// Función helper mejorada
function logBoth(
	level: 'info' | 'warn' | 'error' | 'success' | 'debug' | 'header' | 'subheader',
	message: string,
	scope?: string,
	jobName?: string,
	meta?: any
) {
	// Log en archivo
	const winstonLevel = ['success', 'header', 'subheader'].includes(level) ? 'info' : level;
	fileLogger.log(winstonLevel, message, { scope, jobName, ...meta });

	// Log en consola solo si no es test
	if (env.nodeEnv === 'test') return;

	// Mostrar en consola con formato limpio
	switch (level) {
		case 'header':
			console.log(`\n${message}`);
			break;
		case 'subheader':
			console.log(`${message}`);
			break;
		case 'info':
			consoleLogger.info(message);
			break;
		case 'success':
			consoleLogger.success(message);
			break;
		case 'warn':
			consoleLogger.warn(message);
			break;
		case 'error':
			if (meta?.error instanceof Error) {
				consoleLogger.error(`${message}\n${meta.error.stack || meta.error.message}`);
			} else {
				consoleLogger.error(message);
			}
			break;
		case 'debug':
			if (env.logLevel === 'debug') {
				consoleLogger.debug(message);
			}
			break;
	}
}

// Función para crear tablas simples con límite de ancho
function createTable(headers: string[], rows: string[][]): void {
	if (env.nodeEnv === 'test') return;

	// Función para truncar texto si es muy largo
	const truncateText = (text: string, maxWidth: number): string => {
		if (text.length <= maxWidth) return text;
		return text.substring(0, maxWidth - 3) + '...';
	};

	// Calcular anchos con límites máximos
	const maxColWidth = 30; // Ancho máximo por columna
	const colWidths = headers.map((header, i) => {
		const maxContentWidth = Math.max(header.length, ...rows.map((row) => (row[i] || '').length));
		return Math.min(maxContentWidth + 2, maxColWidth);
	});

	// Header
	const headerRow = headers.map((header, i) => truncateText(header, colWidths[i] - 2).padEnd(colWidths[i])).join('│');

	console.log(`┌${colWidths.map((w) => '─'.repeat(w)).join('┬')}┐`);
	console.log(`│${headerRow}│`);
	console.log(`├${colWidths.map((w) => '─'.repeat(w)).join('┼')}┤`);

	// Rows
	rows.forEach((row) => {
		const formattedRow = row
			.map((cell, i) => truncateText(cell || '', colWidths[i] - 2).padEnd(colWidths[i]))
			.join('│');
		console.log(`│${formattedRow}│`);
	});

	console.log(`└${colWidths.map((w) => '─'.repeat(w)).join('┴')}┘`);
}

// Logger principal del sistema
export const logger = {
	header: (message: string) => logBoth('header', message),
	subheader: (message: string) => logBoth('subheader', message),
	info: (message: string, meta?: any) => logBoth('info', message, 'system', undefined, meta),
	success: (message: string, meta?: any) => logBoth('success', message, 'system', undefined, meta),
	warn: (message: string, meta?: any) => logBoth('warn', message, 'system', undefined, meta),
	error: (message: string, error?: Error, meta?: any) =>
		logBoth('error', message, 'system', undefined, { error, ...meta }),
	debug: (message: string, meta?: any) => logBoth('debug', message, 'system', undefined, meta),
	table: createTable,
};

// Logger para jobs con métodos específicos
export const jobLogger = {
	info: (message: string, jobName?: string, meta?: any) => logBoth('info', message, 'job', jobName, meta),
	success: (message: string, jobName?: string, meta?: any) => logBoth('success', message, 'job', jobName, meta),
	warn: (message: string, jobName?: string, meta?: any) => logBoth('warn', message, 'job', jobName, meta),
	error: (message: string, error?: Error, jobName?: string, meta?: any) =>
		logBoth('error', message, 'job', jobName, { error, ...meta }),
	debug: (message: string, jobName?: string, meta?: any) => logBoth('debug', message, 'job', jobName, meta),

	// Métodos específicos más limpios
	registered: (jobName: string, cronExpression: string, timezone?: string) => {
		const tz = timezone ? ` (${timezone})` : '';
		logBoth('success', `Registrado: ${jobName} → ${cronExpression}${tz}`, 'job', jobName);
	},

	started: (jobName: string) => {
		logBoth('info', `Iniciado: ${jobName}`, 'job', jobName);
	},

	completed: (jobName: string, executionTime: number, message?: string) => {
		const msg = message ? `: ${message}` : '';
		logBoth('success', `Completado: ${jobName} (${executionTime}ms)${msg}`, 'job', jobName);
	},

	failed: (jobName: string, error: Error, executionTime?: number) => {
		const time = executionTime ? ` (${executionTime}ms)` : '';
		logBoth('error', `Falló: ${jobName}${time} → ${error.message}`, 'job', jobName, { error });
	},
};

// Logger para carga de jobs
export const loaderLogger = {
	info: (message: string, meta?: any) => logBoth('info', message, 'loader', undefined, meta),
	warn: (message: string, meta?: any) => logBoth('warn', message, 'loader', undefined, meta),
	error: (message: string, error?: Error, meta?: any) =>
		logBoth('error', message, 'loader', undefined, { error, ...meta }),
};
