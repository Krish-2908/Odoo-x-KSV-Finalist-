import { createLogger, format, transports } from 'winston'
import type { ConsoleTransportInstance, FileTransportInstance } from 'winston/lib/winston/transports/index.js'
import util from 'util'
import config from '../config/config.js'
import { EApplicationEnvironment } from '../constant/application.js'
import path from 'path'
import { fileURLToPath } from 'url'
import * as sourceMapSupport from 'source-map-support'
import { blue, green, red, yellow, magenta } from 'colorette'
import 'winston-mongodb'
import type { MongoDBTransportInstance } from 'winston-mongodb'

// linking trace support
sourceMapSupport.install()

const colorizeLevel = (level: string) => {
    switch (level) {
        case 'ERROR':
            return red(level)
        case 'INFO':
            return blue(level)
        case 'WARN':
            return yellow(level)
        default:
            return level
    }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info

    const customLevel = colorizeLevel(level.toUpperCase())
    const customTimestamp = green(timestamp as string)

    const customMessage = message

    const customMeta = util.inspect(meta, {
        depth: null,
        showHidden: false,
        colors: true
    })

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const customLog = `${customLevel} [${customTimestamp}] ${customMessage}\n${magenta('META')} ${customMeta}\n`

    return customLog
})

const consoleTransport = (): Array<ConsoleTransportInstance> => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(format.timestamp(), consoleLogFormat)
            })
        ]
    }
    return []
}

const fileLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info

    const logMeta: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
        if (value instanceof Error) {
            logMeta[key] = {
                name: value.name,
                message: value.message,
                trace: value.stack || ''
            }
        } else {
            logMeta[key] = value
        }
    }

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        meta: logMeta
    }

    return JSON.stringify(logData, null, 4)
})

const fileTransport = (): Array<FileTransportInstance> => {
    return [
        new transports.File({
            filename: path.join(__dirname, '../', '../', 'logs', `${config.ENV}.log`),
            level: 'info',
            format: format.combine(format.timestamp(), fileLogFormat)
        })
    ]
}

const mongodbTransport = (): Array<MongoDBTransportInstance> => {
    return [
        new transports.MongoDB({
            level: 'info',
            db: config.DATABASE_URL as string,
            metaKey: 'meta',
            expireAfterSeconds: 3600 * 24 * 30,
            collection: 'application-logs'
        })
    ]
}

export default createLogger({
    defaultMeta: {
        meta: {}
    },
    transports: [...consoleTransport(), ...fileTransport(), ...mongodbTransport()]
})
