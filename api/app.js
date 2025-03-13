import Fastify from 'fastify';
import dotenv from 'dotenv';

import { companyRoutes } from './routes/companyRoutes.js';

// Load environment variables from .env file
dotenv.config();
const app = Fastify({
    logger: true
});

// Register routes
companyRoutes(app);
const port = process.env.COMPANY_API_PORT || 3000;

// Start the server
const start = async () => {
    try {
        await app.listen({ port: port, host: '0.0.0.0' });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};


start();
