import { Client } from "@elastic/elasticsearch";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client({
    nodes: [process.env.ELASTICSEARCH_URL || 'http://localhost:9200']
});

/**
 * 
 */
async function findCompany(filters) {
    const query = {
        bool: {
            must: []
        }
    };

    for (const [field, value] of Object.entries(filters)) {
        if (value) {
            query.bool.must.push({ match: { [field]: value } });
        }
    }

    if (query.bool.must.length == 0) {
        return null;
    }

    try {
        const result = await client.search({
            index: 'company',
            body: { query }
        });

        if (result.hits.total.value == 0) {
            return null;
        }

        return result.hits.hits[0]._source;
    } catch (err) {
        console.error('Error querying Elasticsearch:', err);
        throw new Error('Unable to face data from Elasticsearch');
    }
}

export {
    findCompany
};