import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = format;

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'inventory-api' },
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  transports:
    process.env.NODE_ENV === 'production'
      ? [
          new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5_242_880, maxFiles: 5 }),
          new transports.File({ filename: 'logs/combined.log', maxsize: 5_242_880, maxFiles: 5 }),
          new transports.Console({ format: combine(json()) }),
        ]
      : [new transports.Console({ format: combine(colorize(), devFormat) })],
});

export default logger;
