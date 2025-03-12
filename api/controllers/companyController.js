import { findCompany } from '../services/companyServices.js';

const getCompanyProfile = async (req, reply) => {

    const filters = buildFilters(req.query);
    if (isEmpty(filters)) {
        reply.status(400).send({ error: 'At least one query parameter is required' });
    }
    try {
        const profile = await findCompany(filters);
        if (!profile) {
            reply.status(404).send({ message: 'Company profile not found' });
        } else {
            reply.send(profile);
        }
    } catch (err) {
        console.log(err);
        reply.status(500).send({ message: 'Error retrieving the company profile' });
    }

};

/**
 * @param {*} query 
 * @returns 
 */
function buildFilters(query) {
    const {
        name,
        website,
        phoneNumber,
        facebookURI
    } = query;

    const filters = {};

    if (name) {
        filters.name = name;
    }

    if (website) {
        filters.website = website;
    }

    if (phoneNumber) {
        filters.phoneNumber = phoneNumber;
    }

    if (facebookURI) {
        filters.facebook = facebookURI;
    }

    return filters;
}


const isEmpty = (obj) => Object.keys(obj).length === 0;

export {
    getCompanyProfile
};