import Fastify from 'fastify';
import dotenv from 'dotenv';

import { companyRoutes } from './routes/companyRoutes.js';

// Load environment variables from .env file from root level
dotenv.config({ path: '../.env' });

const app = Fastify({
    logger: true
});

// Register routes
companyRoutes(app);
const port = process.env.API_PORT || 3000;

// Start the server
const start = async () => {
    try {
        await app.listen({ port: port });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};


start();
