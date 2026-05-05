// Config: logger
// Responsabilidade: instância Winston configurada para console/serverless
// Depende de: winston

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? format.json()
      : format.printf(({ timestamp, level, message, stack }) =>
          stack
            ? `${timestamp} [${level.toUpperCase()}] ${message}\n${stack}`
            : `${timestamp} [${level.toUpperCase()}] ${message}`,
        ),
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
