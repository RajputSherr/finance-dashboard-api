const AppError = require("../utils/AppError");

const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists.`, 409);
};

const handleMongooseValidation = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation error: ${messages.join(". ")}`, 400);
};

const handleMongooseCastError = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize Mongoose errors to AppError
  if (err.code === 11000) error = handleMongooseDuplicateKey(err);
  if (err.name === "ValidationError") error = handleMongooseValidation(err);
  if (err.name === "CastError") error = handleMongooseCastError(err);

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";
  const message = error.isOperational
    ? error.message
    : "Something went wrong. Please try again.";

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      status,
      message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({ status, message });
};

module.exports = errorHandler;
