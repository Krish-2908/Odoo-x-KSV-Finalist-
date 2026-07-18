// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (error, _, res, __) => {
    res.status(error.statusCode || 500).json(error);
};
//# sourceMappingURL=globalErrorHandler.js.map