import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { Kafka } from 'kafkajs';
import { Client } from '@elastic/elasticsearch';
import { readCSV } from './csvReader.js'; // Import the CSV reader function
import { generateIdFromDomain } from './idGenerator.js';

// Load environment variables from the .env file at the root level
dotenv.config({ path: '../.env' });

// Kafka configuration from .env file
const kafkaBroker = process.env.KAFKA_BROKER;
console.log('Kafka Broker:', kafkaBroker);
const kafkaTopic = process.env.KAFKA_TOPIC;
const kafkaGroupId = process.env.KAFKA_GROUP_ID;

// Elasticsearch configuration from .env file
const esHost = process.env.ES_HOST;
const esIndex = process.env.ES_COMPANY_INDEX;

// CSV file path from .env file
const csvDirPath = process.env.CSV_DIR_PATH;
const csvCompanyNamesFile = process.env.CSV_COMPANY_FILENAME;

// Kafka consumer setup
const kafka = new Kafka({
    brokers: [kafkaBroker]
});
const consumer = kafka.consumer({ groupId: kafkaGroupId });

// Elasticsearch client setup
const esClient = new Client({ node: esHost });

// This will hold the cached CSV data
let csvData = {};

// Load CSV data before starting the consumer
async function loadData() {
    if (!csvDirPath) {
        console.error('CSV directory path not provided');
        process.exit(1);
    }

    if (!csvCompanyNamesFile) {
        console.error('CSV file name not provided');
        process.exit(1);
    }

    // Construct full paths to CSV file
    const companyNamesFilePath = path.resolve(csvDirPath, csvCompanyNamesFile);
    console.log('Loading CSV data from:', companyNamesFilePath);
    if (!fs.existsSync(companyNamesFilePath)) {
        console.error('CSV file not found:', companyNamesFilePath);
        process.exit(1);
    }

    try {
        csvData = await readCSV(companyNamesFilePath); // Pass the path to the loadCSV function
        console.log('CSV Data Loaded');
    } catch (error) {
        console.error('Error loading CSV data', error);
        process.exit(1); // Exit the process if loading CSV fails
    }
}

/**
 * Processes a Kafka message by parsing its content, merging it with data from a CSV file,
 * and saving the result to Elasticsearch.
 *
 * @param {Object} message - The Kafka message object.
 * @param {Buffer} message.value - The value of the Kafka message, expected to be a JSON string.
 * @returns {Promise<void>} - A promise that resolves when the data has been successfully saved to Elasticsearch.
 * @throws {Error} - Throws an error if the message cannot be parsed, the CSV file cannot be read, or the data cannot be saved to Elasticsearch.
 */
async function processMessage(message) {
    const data = JSON.parse(message.value.toString());
    const domain = data.domain;

    const csvDetails = csvData[domain] || {};

    if (!csvDetails) {
        console.log(`No CSV data found for domain: ${domain}`);
        return;
    }

    // Generate ID from domain
    const docId = generateIdFromDomain(domain);
    // Merge data from CSV with Kafka message
    const mergedData = csvDetails;

    for (const key in data) {
        if (data[key] !== null) {
            if (key == 'phone_number' && data[key].length != 0) {
                mergedData['phoneNumber'] = data[key];
            } else if (key === 'facebook_url') {
                mergedData['facebook'] = data[key];
            } else if (key === 'address' || key === 'website') {
                mergedData[key] = data[key];
            }
        }
    }

    // Check and merge with existing data in Elasticsearch
    await mergeWithExistingData(docId, mergedData);
}

async function mergeWithExistingData(docId, newData) {
    try {
        // Try to fetch the existing document from Elasticsearch by its ID
        const { body: existingDoc } = await esClient.get({
            index: esIndex,
            id: docId
        });

        let existingData = {};
        if (existingDoc) {
            existingData = existingDoc._source;
        }
        // Merge data - Only update the fields if they are not empty in new data
        const mergedData = {
            ...existingData,
            ...Object.keys(newData).reduce((acc, key) => {
                // Only include the new value if it's not empty
                if (newData[key] && newData[key].length > 0) {
                    acc[key] = newData[key];
                }
                return acc;
            }, {}),
        };

        // Update the document in Elasticsearch
        await esClient.index({
            index: esIndex,
            id: docId,
            body: mergedData
        });

        console.log(`Document for ${docId} updated in Elasticsearch.`);
    } catch (error) {
        if (!error.meta.body.found) {
            // Document doesn't exist, create it
            try {
                await esClient.index({
                    index: esIndex,
                    id: docId,
                    body: newData
                });
                console.log(`Document for ${docId} created in Elasticsearch.`);
            } catch (error) {
                console.error('Error creating document in Elasticsearch:', error);
            }
        } else {
            // Handle other errors
            console.error('Error during Elasticsearch operation:', error);
        }
    }
}

// Function to start Kafka consumer
async function run() {
    // Load CSV data once before running the consumer
    await loadData();

    await consumer.connect();
    await consumer.subscribe({ topic: kafkaTopic, fromBeginning: true });

    console.log(`Subscribed to Kafka topic: ${kafkaTopic}`);

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                await processMessage(message);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }
    });
}

run().catch(console.error);
