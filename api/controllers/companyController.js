import { findCompany } from '../services/companyServices.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../errors/company.js';

const getCompanyProfile = async (req, reply) => {

    const filters = buildFilters(req.query);
    if (isEmpty(filters)) {
        return reply.status(400).send({
            code: ERROR_CODES.MISSING_PARAMETERS,
            message: ERROR_MESSAGES.MISSING_PARAMETERS
        });
    }
    try {
        const companyProfile = await findCompany(filters);
        if (!companyProfile) {
            return reply.status(404).send({
                code: ERROR_CODES.COMPANY_NOT_FOUND,
                message: ERROR_MESSAGES.COMPANY_NOT_FOUND
            });
        }

        reply.send(companyProfile);

    } catch (err) {
        req.log.error(err);
        reply.status(500).send({
            code: ERROR_CODES.INTERNAL_ERROR,
            message: ERROR_MESSAGES.INTERNAL_ERROR
        });
    }
};

/**
 * @param {*} query 
 * @returns 
 */
function buildFilters(query) {
    const {
        name,
        phoneNumber,
        facebookURI
    } = query;

    const filters = {};

    if (name) {
        filters.name = name;
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