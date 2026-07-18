import DotenvFlow from 'dotenv-flow'

DotenvFlow.config()

export default {
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,

    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretcarpooltokenkey',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ''
}
