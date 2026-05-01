const AppError = require("./error.middleware");

/**
 * Grant access to specific roles
 * @param  {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403,
        ),
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };
