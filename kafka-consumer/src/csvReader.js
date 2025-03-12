import fs from 'fs';
import csv from 'csv-parser';

/**
 * Reads a CSV file and extracts company details into an object.
 *
 * @param {string} csvFilePath - The path to the CSV file to be read.
 * @returns {Promise<Object>} A promise that resolves to an object where each key is a domain and the value is an object containing company details.
 * @property {string} commercialName - The commercial name of the company.
 * @property {string} legalName - The legal name of the company.
 * @property {string[]} availableNames - An array of all available names for the company.
 */
export function readCSV(csvFilePath) {
    return new Promise((resolve, reject) => {
        const companyDetails = {};

        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {

                // Split the company_all_available_names by the '|' character and store it as an array
                const companyAllAvailableNames = row.company_all_available_names
                    ? row.company_all_available_names.split('|').map(name => name.trim()) // Split by '|' and trim any leading/trailing spaces
                    : [];

                // Assuming 'domain' is a column in the CSV
                companyDetails[row.domain] = {
                    commercialName: row.company_commercial_name,
                    legalName: row.company_legal_name,
                    availableNames: companyAllAvailableNames
                };
            })
            .on('end', () => {
                console.log('CSV file has been read and domain details are stored.');
                resolve(companyDetails);
            })
            .on('error', (err) => {
                console.error('Error reading the CSV file:', err);
                reject(err);
            });
    });
}