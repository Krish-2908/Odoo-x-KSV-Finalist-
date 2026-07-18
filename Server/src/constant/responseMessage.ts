export default {
    SUCCESS: 'The Operation has been completed successfully.',
    SOMETHING_WENT_WRONG: 'Something went wrong.',
    NOT_FOUND: (entity: string) => `${entity} not found.`,
    TOO_MANY_REQUEST: `Too many requests! Please try again after some time`,
    INVALID_INPUT: 'The input provided is invalid.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access to this resource is forbidden.',
    INTERNAL_SERVER_ERROR: 'Internal server error occurred.',
    SERVICE_UNAVAILABLE: 'The service is currently unavailable. Please try again after some time.'
}
