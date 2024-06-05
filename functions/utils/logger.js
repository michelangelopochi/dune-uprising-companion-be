import winston from 'winston';
import path from 'path';

const logDir = 'log';
const filename = path.join(logDir, 'results.log');

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD/MM/YYYY HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename })
    ]
});

// logger.info('This is an informational message');
// logger.error('This is an error message');