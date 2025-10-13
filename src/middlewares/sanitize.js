import mongoSanitize from 'express-mongo-sanitize';

// Patch: avoid reassigning req.query for Express 5
export const safeMongoSanitize = () => (req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.query) {
    // clone sanitized query to a new object
    const sanitizedQuery = mongoSanitize.sanitize(req.query);
    Object.keys(sanitizedQuery).forEach((key) => {
      req.query[key] = sanitizedQuery[key];
    });
  }
  next();
};
