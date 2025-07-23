# 🕐 Cron Jobs Template con TypeScript

Template robusto y genérico para crear y gestionar cron jobs con TypeScript, diseñado para ser fácil de usar y altamente configurable.

## 🚀 Características

- ✅ **TypeScript nativo** con tipado completo
- ⏰ **Programación flexible** con expresiones cron
- 🌍 **Soporte de zonas horarias** configurable
- 📝 **Sistema de logging avanzado** con rotación de archivos
- 🔄 **Callbacks personalizables** (onSuccess, onError, onComplete)
- 🛡️ **Manejo robusto de errores** y reintentos
- 📊 **Monitoreo de ejecución** y métricas
- 🔧 **Configuración por variables de entorno**
- 🏗️ **Arquitectura modular** y escalable

## 🏗️ Arquitectura Desacoplada

Este template utiliza una **arquitectura desacoplada** que separa la configuración de la lógica:

### 📁 Estructura de cada job:

```
source/jobs/mi-job/
├── config.ts      # Solo configuración (export default)
└── function.ts    # Solo función de ejecución (export default)
```

### 🎯 Ventajas de esta arquitectura:

1. **Separación de responsabilidades**: La configuración está separada de la lógica
2. **Reutilización**: Puedes reutilizar configuraciones o funciones
3. **Mantenibilidad**: Es más fácil encontrar y modificar configuraciones
4. **Escalabilidad**: Permite configuraciones dinámicas o funciones compartidas
5. **Testing**: Puedes probar configuración y lógica por separado

### 📋 Templates disponibles:

- `source/templates/config.example.ts` - Template de configuración
- `source/templates/function.example.ts` - Template de función

### 🔧 Creación rápida de jobs:

```bash
# Crear directorio
mkdir source/jobs/mi-nuevo-job

# Copiar templates
cp source/templates/config.example.ts source/jobs/mi-nuevo-job/config.ts
cp source/templates/function.example.ts source/jobs/mi-nuevo-job/function.ts

# Editar archivos según necesidades
```

## 📁 Estructura del proyecto

\`\`\`
cron-ts/
├── source/
│ ├── jobs/ # Directorio de jobs
│ │ ├── example-cleanup/ # Job de ejemplo: limpieza
│ │ │ ├── config.ts # Configuración del job
│ │ │ └── function.ts # Función de ejecución
│ │ └── daily-report/ # Job de ejemplo: reportes
│ │ ├── config.ts # Configuración del job
│ │ └── function.ts # Función de ejecución
│ ├── templates/ # Templates para crear nuevos jobs
│ │ ├── config.example.ts # Template de configuración
│ │ └── function.example.ts # Template de función
│ ├── config/
│ │ ├── env.ts # Configuración de entorno
│ │ └── errors.ts # Clases de error personalizadas
│ ├── lib/
│ │ ├── job-manager.ts # Gestor principal de jobs
│ │ ├── job-loader.ts # Cargador automático de jobs
│ │ ├── logger.ts # Sistema de logging
│ │ └── zod.ts # Utilidades de validación
│ ├── scripts/
│ │ └── list-jobs.ts # Script para listar jobs
│ ├── types/
│ │ └── global.d.ts # Tipos globales
│ └── index.ts # Punto de entrada principal
├── logs/ # Directorio de logs (auto-creado)
├── package.json
└── README.md
\`\`\`

## 🛠️ Instalación

\`\`\`bash

# Clonar el template

git clone <repository-url> mi-proyecto-cron
cd mi-proyecto-cron

# Instalar dependencias

pnpm install

# Configurar variables de entorno

cp .env.example .env

# Editar .env según tus necesidades

\`\`\`

## ⚙️ Configuración

### Variables de entorno (.env)

\`\`\`env
NODE_ENV=development
LOG_LEVEL=info
LOG_DIR=./logs
JOBS_ENABLED=true
TIMEZONE=America/Mexico_City
\`\`\`

### Configuración de zona horaria

El sistema soporta cualquier zona horaria válida de [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones):

\`\`\`env

# Ejemplos

TIMEZONE=America/Mexico_City
TIMEZONE=America/New_York
TIMEZONE=Europe/Madrid
TIMEZONE=Asia/Tokyo
TIMEZONE=UTC
\`\`\`

## 📝 Crear un nuevo job

### 1. Crear estructura de directorio

\`\`\`bash
mkdir source/jobs/mi-nuevo-job
\`\`\`

### 2. Crear archivos de configuración y función

Copia los templates y modifícalos:

\`\`\`bash

# Copiar templates

cp source/templates/config.example.ts source/jobs/mi-nuevo-job/config.ts
cp source/templates/function.example.ts source/jobs/mi-nuevo-job/function.ts
\`\`\`

#### 2a. Configuración del job (config.ts)

\`\`\`typescript
// source/jobs/mi-nuevo-job/config.ts
import type { JobConfig } from '../../types/global.js';

export const config: JobConfig = {
name: 'mi-nuevo-job',
cronExpression: '0 _/6 _ \* \*', // Cada 6 horas
timezone: 'America/Mexico_City',
enabled: true,
runOnInit: false, // Ejecutar inmediatamente al iniciar
maxRetries: 3,
retryDelay: 5000, // 5 segundos
callback: {
onSuccess: async (result, context) => {
console.log(\`✅ Job \${context.jobName} completado: \${result.message}\`);
},
onError: async (error, context) => {
console.error(\`❌ Error en \${context.jobName}: \${error.message}\`);
// Aquí puedes enviar notificaciones, emails, etc.
},
onComplete: async (result, context) => {
console.log(\`🏁 Job \${context.jobName} finalizado en \${result.executionTime}ms\`);
}
},
metadata: {
description: 'Descripción de lo que hace este job',
author: 'Tu Nombre',
version: '1.0.0',
tags: ['ejemplo', 'procesamiento']
}
};

export const execute: JobFunction = async (context: JobExecutionContext): Promise<JobResult> => {
try {
// Tu lógica aquí
console.log(\`Ejecutando job: \${context.jobName} a las \${context.startTime}\`);
// Simular trabajo
await new Promise(resolve => setTimeout(resolve, 1000));
return {
success: true,
message: 'Job ejecutado exitosamente',
data: {
processedItems: 42,
timestamp: new Date().toISOString()
},
executionTime: 0 // Se calcula automáticamente
};
} catch (error) {
return {
success: false,
error: error instanceof Error ? error : new Error(String(error)),
message: 'Error ejecutando el job',
executionTime: 0
};
}
};
\`\`\`

## 🎯 Expresiones Cron

| Expresión           | Descripción                     |
| ------------------- | ------------------------------- |
| \`0 0 \* \* \*\`    | Todos los días a medianoche     |
| \`0 9 \* \* 1-5\`   | Lunes a viernes a las 9:00 AM   |
| \`_/15 _ \* \* \*\` | Cada 15 minutos                 |
| \`0 _/2 _ \* \*\`   | Cada 2 horas                    |
| \`0 0 1 \* \*\`     | El primer día de cada mes       |
| \`0 0 \* \* 0\`     | Todos los domingos a medianoche |

### Formato: \`minuto hora día-mes mes día-semana\`

- **Minuto**: 0-59
- **Hora**: 0-23
- **Día del mes**: 1-31
- **Mes**: 1-12
- **Día de la semana**: 0-7 (0 y 7 = domingo)

## 🏃‍♂️ Ejecución

### Modo desarrollo (con watch)

\`\`\`bash
pnpm dev
\`\`\`

### Modo producción

\`\`\`bash
pnpm start
\`\`\`

### Listar jobs disponibles

\`\`\`bash
pnpm jobs:list
\`\`\`

## 📊 Logging

El sistema genera logs automáticamente en diferentes archivos:

- \`logs/app-YYYY-MM-DD.log\` - Logs generales
- \`logs/jobs-YYYY-MM-DD.log\` - Logs específicos de jobs
- \`logs/error-YYYY-MM-DD.log\` - Solo errores
- \`logs/exceptions-YYYY-MM-DD.log\` - Excepciones no manejadas

### Niveles de log disponibles:

- \`error\` - Solo errores críticos
- \`warn\` - Advertencias y errores
- \`info\` - Información general (recomendado)
- \`debug\` - Información detallada para desarrollo

## 🔧 API del JobManager

### Métodos principales

\`\`\`typescript
import { jobManager } from './source/lib/job-manager.js';

// Ejecutar un job manualmente
const result = await jobManager.executeJobManually('mi-job');

// Iniciar un job específico
jobManager.start('mi-job');

// Detener un job específico
jobManager.stop('mi-job');

// Obtener información de todos los jobs
const jobsInfo = jobManager.getJobsInfo();

// Obtener número de jobs activos
const activeCount = jobManager.getActiveJobsCount();
\`\`\`

## 🚀 Ejemplos de uso

### Job de limpieza de archivos

Ver: \`source/jobs/example-cleanup/\`

- Limpia archivos temporales antiguos
- Configurable por edad de archivos
- Reporta espacio liberado
- **Archivos**: \`config.ts\` + \`function.ts\`

### Job de reporte diario

Ver: \`source/jobs/daily-report/\`

- Genera reportes automáticos
- Recopila métricas del sistema
- Guarda resultados en JSON
- **Archivos**: \`config.ts\` + \`function.ts\`

### Job de respaldo de base de datos

\`\`\`typescript
export const config: JobConfig = {
name: 'database-backup',
cronExpression: '0 2 \* \* \*', // 2:00 AM diariamente
timezone: 'UTC',
enabled: true,
callback: {
onSuccess: async (result) => {
// Enviar notificación de éxito
await sendSlackNotification(\`✅ Backup completado: \${result.message}\`);
},
onError: async (error) => {
// Alerta crítica
await sendEmailAlert(\`🚨 FALLO EN BACKUP: \${error.message}\`);
}
}
};

export const execute: JobFunction = async (context) => {
// Lógica de respaldo aquí
return { success: true, message: 'Backup completado' };
};
\`\`\`

## 📚 Tipos TypeScript

### JobConfig

\`\`\`typescript
interface JobConfig {
name: string; // Nombre único del job
cronExpression: string; // Expresión cron
timezone?: string; // Zona horaria (opcional)
enabled?: boolean; // Habilitado (default: true)
runOnInit?: boolean; // Ejecutar al iniciar (default: false)
maxRetries?: number; // Máximo de reintentos
retryDelay?: number; // Delay entre reintentos (ms)
callback?: JobCallback; // Callbacks de eventos
metadata?: Record<string, any>; // Metadatos adicionales
}
\`\`\`

### JobResult

\`\`\`typescript
interface JobResult {
success: boolean; // Si el job fue exitoso
message?: string; // Mensaje descriptivo
data?: any; // Datos de resultado
error?: Error; // Error si falló
executionTime: number; // Tiempo de ejecución en ms
}
\`\`\`

## 🔒 Manejo de errores

El sistema incluye manejo robusto de errores:

- **Errores de job**: Capturados y loggeados automáticamente
- **Reintentos automáticos**: Configurable por job
- **Callbacks de error**: Para notificaciones personalizadas
- **Logs estructurados**: Para debugging y monitoreo

## 🐳 Docker (Opcional)

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

CMD ["pnpm", "start"]
\`\`\`

## 📋 Comandos útiles

\`\`\`bash

# Desarrollo con hot reload

pnpm dev

# Producción

pnpm start

# Listar jobs

pnpm jobs:list

# Compilar TypeScript

pnpm build

# Linting (si se configura)

pnpm lint

# Tests (si se configuran)

pnpm test
\`\`\`

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE

## 🔗 Recursos útiles

- [Cron Expression Generator](https://crontab.guru/)
- [Node-cron Documentation](https://github.com/node-cron/node-cron)
- [Winston Logging](https://github.com/winstonjs/winston)
- [IANA Time Zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
