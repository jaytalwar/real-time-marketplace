// Express 5 exposes req.query/req.params as getter-only properties, so
// validated results are merged in place rather than reassigned.
const validate = (schema) => (req, res, next) => {
    try {
        if (schema.body) req.body = schema.body.parse(req.body);
        if (schema.query) Object.assign(req.query, schema.query.parse(req.query));
        if (schema.params) Object.assign(req.params, schema.params.parse(req.params));
        next();
    } catch (err) {
        next(err);
    }
};

export default validate;
