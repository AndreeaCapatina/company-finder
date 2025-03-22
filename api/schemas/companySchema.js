import { ERROR_CODES, ERROR_MESSAGES } from "../errors/company.js";


const companyQuerySchema = {
    $id: 'companyQuerySchema',
    type: 'object',
    properties: {
        name: {
            type: 'string',
            minLength: 1,
            maxLength: 250,
            errorMessage: {
                type: `${ERROR_CODES.INVALID_COMPANY_NAME}: ${ERROR_MESSAGES.INVALID_COMPANY_NAME}`,
                minLength: `${ERROR_CODES.INVALID_COMPANY_NAME}: ${ERROR_MESSAGES.INVALID_COMPANY_NAME}`,
                maxLength: `${ERROR_CODES.INVALID_COMPANY_NAME}: ${ERROR_MESSAGES.INVALID_COMPANY_NAME}`
            }
        },
        phoneNumber: {
            type: 'string',
            pattern: '^[0-9+\\-() ]+$',
            errorMessage: {
                type: `${ERROR_CODES.INVALID_PHONE_NUMBER}: ${ERROR_MESSAGES.INVALID_PHONE_NUMBER}`,
                pattern: `${ERROR_CODES.INVALID_PHONE_NUMBER}: ${ERROR_MESSAGES.INVALID_PHONE_NUMBER}`
            }
        },
        facebook: {
            type: 'string',
            pattern: '^https:\\/\\/www\\.facebook\\.com\\/.+$',
            errorMessage: {
                type: `${ERROR_CODES.INVALID_FACEBOOK_URL}: ${ERROR_MESSAGES.INVALID_FACEBOOK_URL}`,
                pattern: `${ERROR_CODES.INVALID_FACEBOOK_URL}: ${ERROR_MESSAGES.INVALID_FACEBOOK_URL}`
            }
        },
    },
    minProperties: 1, // At least one query parameter is required
    additionalProperties: false,
    errorMessage: {
        minProperties: `${ERROR_CODES.MISSING_PARAMETERS}: ${ERROR_MESSAGES.MISSING_PARAMETERS}`,
        additionalProperties: `${ERROR_CODES.INVALID_PARAMETER}: ${ERROR_MESSAGES.INVALID_PARAMETER}`
    }
};

export {
    companyQuerySchema
};