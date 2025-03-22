import { Client } from '@elastic/elasticsearch';
import { config } from './env.js';

export const esClient = new Client({ nodes: config.elasticsearch.nodes });