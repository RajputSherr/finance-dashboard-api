const AppError = require("../utils/AppError");

/**
 * Restrict access to specific roles.
 * Usage: authorize("admin") or authorize("admin", "analyst")
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = authorize;
