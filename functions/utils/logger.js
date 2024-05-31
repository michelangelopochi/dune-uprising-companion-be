import winston from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config();

const logDir = 'log';
const filename = path.join(logDir, 'results.log');

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MM-YYYY HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        // new winston.transports.File({ filename }),
        new CloudWatchTransport({
            logGroupName: 'duneuprisingcompanionapp',  // Sostituisci con il tuo Log Group
            logStreamName: 'duneuprisingcompanionapp-log',  // Sostituisci con il tuo Log Stream
            awsRegion: 'eu-west-3',  // Sostituisci con la tua regione AWS
            awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,  // Sostituisci con il tuo Access Key ID
            awsSecretKey: process.env.AWS_ACCESS_KEY_SECRET,  // Sostituisci con il tuo Secret Access Key
            jsonMessage: true
        })
    ]
});

// logger.info('This is an informational message');
// logger.error('This is an error message');