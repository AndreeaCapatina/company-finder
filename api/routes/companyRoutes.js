import { getCompanyProfile } from "../controllers/companyController.js";
import { companyQuerySchema } from "../schemas/companySchema.js";

const companyRoutes = (fastify) => {
    // Register the company validation schema
    fastify.addSchema(companyQuerySchema);

    // Register the company route
    fastify.get(
        '/company',
        {
            schema: {
                querystring: {
                    $ref: 'companyQuerySchema'
                }
            }
        },
        getCompanyProfile
    );
};

export {
    companyRoutes
};