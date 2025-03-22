import { esClient } from '../config/elasticsearch.js';
import { config } from '../config/env.js';

const companyIndex = config.elasticsearch.companyIndex;

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
        const result = await esClient.search({
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