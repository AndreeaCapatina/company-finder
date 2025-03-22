export const ERROR_CODES = {
    INVALID_COMPANY_NAME: "INVALID_COMPANY_NAME",
    INVALID_PHONE_NUMBER: "INVALID_PHONE_NUMBER",
    INVALID_FACEBOOK_URL: "INVALID_FACEBOOK_URL",
    MISSING_PARAMETERS: "MISSING_PARAMETERS",
    INVALID_PARAMETER: "INVALID_PARAMETER",
    COMPANY_NOT_FOUND: "COMPANY_NOT_FOUND",
    INTERNAL_ERROR: "INTERNAL_ERROR"
};

export const ERROR_MESSAGES = {
    INVALID_COMPANY_NAME: "The company name must be a string between 1 and 250 characters.",
    INVALID_PHONE_NUMBER: "Phone number must contain only digits, '+', '-', or spaces.",
    INVALID_FACEBOOK_URL: "Facebook must be a valid URL (e.g., https://www.facebook.com/company).",
    MISSING_PARAMETERS: "At least one query parameter (name, phoneNumber, or facebook) is required.",
    INVALID_PARAMETER: "Only 'name', 'phoneNumber', and 'facebook' are allowed as query parameters.",
    COMPANY_NOT_FOUND: "No company found matching the given criteria.",
    INTERNAL_ERROR: "An unexpected error occurred. Please try again later."
};