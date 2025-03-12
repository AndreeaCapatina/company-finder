import { Client } from "@elastic/elasticsearch";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const client = new Client({
    nodes: [process.env.ES_HOST || 'http://localhost:9200']
});

const companyIndex = process.env.ES_COMPANY_INDEX;

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
            if (field === 'name') {
                const boolShould = {
                    bool: {
                        should: [
                            { match: { commercialName: value } },
                            { match: { legalName: value } },
                            { match: { availableNames: value } }
                        ]
                    }
                };
                query.bool.must.push(boolShould);
            } else {
                query.bool.must.push({ match: { [field]: value } });
            }
        }
    }

    if (query.bool.must.length == 0) {
        return null;
    }

    try {
        const result = await client.search({
            index: companyIndex,
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