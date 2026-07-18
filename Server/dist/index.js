import app from './app.js';
import config from './config/config.js';
import logger from './utils/logger.js';
const server = app.listen(config.PORT);
(() => {
    try {
        logger.info(`Application_Started`, {
            meta: {
                PORT: config.PORT,
                SERVER_URL: config.SERVER_URL
            }
        });
    }
    catch (error) {
        logger.error(`Application_Error`, { meta: error });
        server.close((error) => {
            if (error) {
                logger.error(`Application_Error`, { meta: error });
            }
            process.exit(1);
        });
    }
})();
//# sourceMappingURL=index.js.map