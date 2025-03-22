import path from 'path';
import fs from 'fs';

import { config } from './config/env.js';
import { consumer } from './config/kafka.js';
import { esClient } from './config/elasticsearch.js';
import { readCSV } from './csvReader.js';
import { generateIdFromDomain } from './idGenerator.js';

async function loadData() {
    const { dirPath, companyFilename } = config.csv;

    if (!dirPath) {
        console.error('CSV directory path not provided');
        process.exit(1);
    }

    if (!companyFilename) {
        console.error('CSV file name not provided');
        process.exit(1);
    }
    const companyNamesFilePath = path.resolve(dirPath, companyFilename);

    if (!fs.existsSync(companyNamesFilePath)) {
        console.error(`CSV file not found: ${companyNamesFilePath}`);
        process.exit(1);
    }

    try {
        return await readCSV(companyNamesFilePath);
    } catch (error) {
        console.error('Error loading CSV data:', error);
        process.exit(1); // Exit the process if loading CSV fails
    }
}

/**
 * Processes a Kafka message by parsing its content, merging it with data from a CSV file,
 * and saving the result to Elasticsearch.
 *
 */
async function processMessage(message, csvData) {
    let msgData;
    try {
        msgData = JSON.parse(message.value.toString());
    } catch (error) {
        console.error(`Error parsing Kafka message: ${error.message}`);
        return;
    }

    const domain = msgData.domain;
    const companyDetails = csvData[domain] || {};

    if (Object.keys(companyDetails).length === 0) {
        console.log(`No CSV data found for domain: ${domain}`);
        return;
    }

    const docId = generateIdFromDomain(domain);
    const mergedData = { ...companyDetails };

    for (const key in msgData) {
        if (msgData[key] !== null) {
            switch (key) {
                case 'phone_number':
                    if (msgData[key].length !== 0) {
                        mergedData['phoneNumber'] = msgData[key];
                    }
                    break;
                case 'facebook_url':
                    mergedData['facebook'] = msgData[key];
                    break;
                case 'address':
                case 'website':
                    mergedData[key] = msgData[key];
                    break;
            }
        }
    }

    await mergeWithExistingData(docId, mergedData);
}

async function mergeWithExistingData(docId, newData) {
    const esIndex = config.elasticsearch.companyIndex;
    try {
        // Update the document in Elasticsearch
        await esClient.update({
            index: esIndex,
            id: docId,
            body: {
                doc: newData,
                doc_as_upsert: true
            }
        });

        console.log(`Document for ${docId} updated in Elasticsearch.`);
    } catch (error) {
        if (error.meta && error.meta.statusCode === 404) {
            console.warn(`Document ${docId} not found, creating new one.`);
            try {
                await esClient.index({
                    index: esIndex,
                    id: docId,
                    body: newData
                });
                console.log(`Document ${docId} created.`);
            } catch (indexError) {
                console.error('Error creating document in Elasticsearch:', indexError);
            }
        } else {
            console.error('Error during Elasticsearch operation:', error);
        }
    }
}

async function run() {
    // Load CSV data once before running the consumer
    const csvData = await loadData();

    await consumer.connect();
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: true });
    console.log(`Subscribed to Kafka topic: ${config.kafka.topic}`);

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                await processMessage(message, csvData);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }
    });
}

run().catch(console.error);
