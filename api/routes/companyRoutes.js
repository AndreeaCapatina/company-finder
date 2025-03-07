import { getCompanyProfile } from "../controllers/companyController.js";

const companyRoutes = (fastify) => {
    fastify.get("/company", getCompanyProfile);
};

export {
    companyRoutes
};