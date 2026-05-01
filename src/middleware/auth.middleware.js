const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("./error.middleware");

/**
 * Protect routes - verify JWT token
 */
const authenticateToken = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(
      new AppError("Not authorized to access this route. Please login.", 401),
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        new AppError("The user belonging to this token no longer exists", 401),
      );
    }

    // Check if user is enabled
    if (!user.enabled) {
      return next(new AppError("Your account has been deactivated", 401));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch {
    return next(new AppError("Not authorized to access this route", 401));
  }
});

module.exports = { authenticateToken };
