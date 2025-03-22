import { esClient } from '../config/elasticsearch.js';
import { config } from '../config/env.js';

const companyIndex = config.elasticsearch.companyIndex;

async function findCompany(filters) {
    if (!filters || Object.keys(filters).length === 0) {
        return null;
    }

    const query = {
        bool: {
            must: []
        }
    };

    for (const [field, value] of Object.entries(filters)) {
        if (!value) {
            continue;
        }

        if (field === 'name') {
            query.bool.must.push({
                bool: {
                    should: [
                        { match: { commercialName: value } },
                        { match: { legalName: value } },
                        { match: { availableNames: value } }
                    ]
                }
            });
        } else {
            query.bool.must.push({ match: { [field]: value } });
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

        const totalHits = result?.hits?.total?.value ?? 0;
        if (totalHits == 0) {
            return null;
        }

        return result.hits.hits[0]._source;
    } catch (err) {
        throw new Error(`Failed to fetch data: ${err.message}`);
    }
}

export {
    findCompany
};