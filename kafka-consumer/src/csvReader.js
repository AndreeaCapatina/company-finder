import fs from 'fs';
import csv from 'csv-parser';

/**
 * Reads a CSV file and extracts company details into an object with the following fields:
 * - commercialName
 * - legalName
 * - availableNames - An array of all available names for the company.
 */
export function readCSV(csvFilePath) {
    return new Promise((resolve, reject) => {
        const companyDetails = {};

        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                if (!row.domain) {
                    console.warn(`Skipping row with missing domain: ${row}`);
                    return; 
                }

                // Split the company_all_available_names by the '|'
                const companyAllAvailableNames = row.company_all_available_names
                ? row.company_all_available_names.split('|').map(name => name.trim()).filter(name => name.length > 0)
                : [];

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