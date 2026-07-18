import { createLogger, format, transports } from 'winston';
import util from 'util';
import config from '../config/config.js';
import { EApplicationEnvironment } from '../constant/application.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info;
    const customLevel = level.toUpperCase();
    const customTimestamp = timestamp;
    const customMessage = message;
    const customMeta = util.inspect(meta, {
        depth: null,
        showHidden: false
    });
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const customLog = `${customLevel} [${customTimestamp}] ${customMessage}\n${'META'} ${customMeta}\n`;
    return customLog;
});
const consoleTransport = () => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(format.timestamp(), consoleLogFormat)
            })
        ];
    }
    return [];
};
const fileLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info;
    const logMeta = {};
    for (const [key, value] of Object.entries(meta)) {
        if (value instanceof Error) {
            logMeta[key] = {
                name: value.name,
                message: value.message,
                trace: value.stack || ''
            };
        }
        else {
            logMeta[key] = value;
        }
    }
    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        meta: logMeta
    };
    return JSON.stringify(logData, null, 4);
});
const fileTransport = () => {
    return [
        new transports.File({
            filename: path.join(__dirname, '../', '../', 'logs', `${config.ENV}.log`),
            level: 'info',
            format: format.combine(format.timestamp(), fileLogFormat)
        })
    ];
};
export default createLogger({
    defaultMeta: {
        meta: {}
    },
    transports: [...consoleTransport(), ...fileTransport()]
});
//# sourceMappingURL=logger.js.map