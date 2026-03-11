import { sendError } from '../utils/index.js';

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return sendError(res, {
        message: 'Validation failed',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    if (source === 'query') {
      // req.query is read-only in Express 5 — store validated query separately
      req.validQuery = value;
    } else {
      req[source] = value;
    }
    next();
  };
};

export default validate;
