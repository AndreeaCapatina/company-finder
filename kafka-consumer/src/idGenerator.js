import crypto from 'crypto';

/**
 * Generates a unique ID from a domain using SHA-256 and truncates it to 27 characters.
 * @param {string} domain - The domain string to generate the ID from.
 * @returns {string} - The generated 27-character ID.
 */
export function generateIdFromDomain(domain) {
    // Hash the domain using SHA-256
    const hash = crypto.createHash('sha256').update(domain).digest('hex');
    
    // Truncate the hash to the first 27 characters
    return hash.substring(0, 27);
}