import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.COMPANY_API_PORT || 3000,
    elasticsearch: {
        nodes: [process.env.ES_HOST || 'http://localhost:9200'],
        companyIndex: process.env.ES_COMPANY_INDEX
    }
};
