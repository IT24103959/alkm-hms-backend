// Response formatter utility
// Standardized API response format

class ApiResponse {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  }

  static error(
    res,
    message = "Error occurred",
    statusCode = 500,
    errors = null,
  ) {
    return res.status(statusCode).json({
      status: "error",
      message,
      ...(errors && { errors }),
    });
  }

  static paginated(res, data, page, limit, total, message = "Success") {
    return res.status(200).json({
      status: "success",
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}

module.exports = ApiResponse;
