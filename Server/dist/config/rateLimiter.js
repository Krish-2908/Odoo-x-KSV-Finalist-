import { RateLimiterMongo } from 'rate-limiter-flexible';
export let rateLimiterMongo = null;
const POINTS = 10;
const DURATION = 60;
export const initRateLimiter = (mongooseConnection) => {
    rateLimiterMongo = new RateLimiterMongo({
        storeClient: mongooseConnection,
        points: POINTS,
        duration: DURATION
    });
};
//# sourceMappingURL=rateLimiter.js.map