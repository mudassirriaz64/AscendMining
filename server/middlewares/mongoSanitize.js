const sanitize = (obj) => {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => sanitize(item));
  }
};

const mongoSanitizeMiddleware = (req, _res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
};

module.exports = mongoSanitizeMiddleware;
