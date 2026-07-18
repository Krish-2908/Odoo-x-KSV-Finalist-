import express, {} from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url';
import router from './router/apiRouter.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import responseMessage from './constant/responseMessage.js';
import httpError from './utils/httpError.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../', 'public')));
// Routes
app.use('/api/v1', router);
// 404 Handler
app.use((req, _, next) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('endpoint'));
    }
    catch (error) {
        httpError(next, error, req, 404);
    }
});
// Global Error Handler
app.use(globalErrorHandler);
export default app;
//# sourceMappingURL=app.js.map