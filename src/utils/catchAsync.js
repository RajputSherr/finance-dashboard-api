/**
 * Wraps async route handlers to avoid try/catch boilerplate.
 * Passes errors to Express error handler automatically.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
