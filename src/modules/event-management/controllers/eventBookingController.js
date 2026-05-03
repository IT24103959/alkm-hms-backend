const eventBookingService = require("../services/eventBookingService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await eventBookingService.listBookings(
    req.user.role,
    req.user.username,
  );
  ApiResponse.success(res, bookings, "Event bookings retrieved successfully");
});

exports.createBooking = asyncHandler(async (req, res) => {
  const booking = await eventBookingService.createBooking(
    req.body,
    req.user.username,
    req.user.role,
  );
  ApiResponse.success(res, booking, "Event booking created successfully", 201);
});

exports.updateBooking = asyncHandler(async (req, res) => {
  const booking = await eventBookingService.updateBooking(
    req.params.id,
    req.body,
  );
  ApiResponse.success(res, booking, "Event booking updated successfully");
});

exports.deleteBooking = asyncHandler(async (req, res) => {
  await eventBookingService.deleteBooking(req.params.id);
  ApiResponse.success(res, null, "Event booking deleted successfully");
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await eventBookingService.getAnalytics();
  ApiResponse.success(res, analytics, "Analytics retrieved successfully");
});