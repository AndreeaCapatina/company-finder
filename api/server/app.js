import Fastify from 'fastify';
import AjvErrors from 'ajv-errors';
import { companyRoutes } from '../routes/companyRoutes.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../errors/company.js';

const app = Fastify({
    logger: true,
    ajv: {
        customOptions: { allErrors: true },
        plugins: [AjvErrors]
    }
});

// Register routes
app.register(companyRoutes);

// Custom error handler
app.setErrorHandler((error, request, reply) => {
    let statusCode = error.statusCode || 500;
    let errorResponse = {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES.INTERNAL_ERROR
    };

    if (error.validation) {
        const validationError = error.validation[0];

        // Extract code and message
        const [code, message] = validationError.message.split(": ");
        errorResponse.code = code || ERROR_CODES.INVALID_PARAMETER;
        errorResponse.message = message || ERROR_MESSAGES.INVALID_PARAMETER;
        statusCode = 400;
    } else {
        errorResponse.code = error.code ?? errorResponse.code;
        errorResponse.message = error.message ?? errorResponse.message;
    }

    reply.status(statusCode).send(errorResponse);
});


export {
    app
};

