const validate = (schema) => {
  return (req, res, next) => {
    const isGetOrDelete = req.method === 'GET' || req.method === 'DELETE';
    const dataToValidate = isGetOrDelete ? req.query : req.body;
    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          status: 422,
          details: errors,
        },
      });
    }
    if (isGetOrDelete) {
      req.query = result.data;
    } else {
      req.body = result.data;
    }
    next();
  };
};

module.exports = validate;
