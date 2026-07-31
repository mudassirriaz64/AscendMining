class AppError extends Error {
  constructor(code, message, status, extra = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.isOperational = true;
    if (extra) {
      Object.assign(this, extra);
    }
  }
}

module.exports = AppError;
