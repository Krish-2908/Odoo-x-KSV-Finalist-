import errorObject from './errorObject.js';
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export default (nextFunc, error, req, errorStatusCode = 500) => {
    const errorObj = errorObject(error, req, errorStatusCode);
    return nextFunc(errorObj);
};
//# sourceMappingURL=httpError.js.map