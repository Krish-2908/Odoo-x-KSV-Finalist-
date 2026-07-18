import app from './app.js'
import config from './config/config.js'
import { initRateLimiter } from './config/rateLimiter.js'
import databaseService from './services/databaseService.js'
import logger from './utils/logger.js'
import { initSocket } from './services/socketService.js'

const server = app.listen(config.PORT)
initSocket(server)

;(() => {
    try {
        // Database Connection
        databaseService
            .connect()
            .then((connection) => {
                logger.info('Database_Connection', {
                    meta: {
                        Connection_Name: connection.name
                    }
                })
                initRateLimiter(connection)
                logger.info('Rate_Limiter_Initiated')
            })
            .catch((error) => {
                logger.error('Database_Connection', {
                    meta: {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        ERROR: error
                    }
                })
            })
        logger.info(`Application_Started`, {
            meta: {
                PORT: config.PORT,
                SERVER_URL: config.SERVER_URL
            }
        })
    } catch (error) {
        logger.error(`Application_Error`, { meta: error })
        server.close((error) => {
            if (error) {
                logger.error(`Application_Error`, { meta: error })
            }
            process.exit(1)
        })
    }
})()
