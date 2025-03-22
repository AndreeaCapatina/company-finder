import dotenv from 'dotenv';

dotenv.config();

export const config = {
    kafka: {
        broker: process.env.KAFKA_BROKER,
        topic: process.env.KAFKA_TOPIC,
        groupId: process.env.KAFKA_GROUP_ID
    },
    elasticsearch: {
        nodes: [process.env.ES_HOST || 'http://localhost:9200'],
        companyIndex: process.env.ES_COMPANY_INDEX
    },
    csv: {
        dirPath: process.env.CSV_DATA_PATH,
        companyFilename: process.env.CSV_COMPANY_FILENAME
    }
};