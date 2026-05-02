const roomBookingService = require("../services/roomBookingService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

exports.createBooking = asyncHandler(async (req, res) => {
  const booking = await roomBookingService.create(req.body, req.user);
  ApiResponse.success(res, booking, "Room booking created successfully", 201);
});

exports.updateBooking = asyncHandler(async (req, res) => {
  const booking = await roomBookingService.update(req.params.id, req.body);
  ApiResponse.success(res, booking, "Room booking updated successfully");
});

exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await roomBookingService.findAll();
  ApiResponse.success(res, bookings, "Room bookings retrieved successfully");
});

exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await roomBookingService.findMine(req.user.username);
  ApiResponse.success(res, bookings, "Your bookings retrieved successfully");
});

exports.requestCancellation = asyncHandler(async (req, res) => {
  const booking = await roomBookingService.requestCancellation(
    req.params.id,
    req.user,
  );
  ApiResponse.success(res, booking, "Cancellation request submitted");
});

exports.approveCancellation = asyncHandler(async (req, res) => {
  const booking = await roomBookingService.approveCancellation(req.params.id);
  ApiResponse.success(res, booking, "Cancellation approved");
});

exports.checkAvailability = asyncHandler(async (req, res) => {
  const { roomNumber, checkInDate, checkOutDate } = req.query;
  const result = await roomBookingService.checkAvailability(
    roomNumber,
    checkInDate,
    checkOutDate,
  );
  ApiResponse.success(res, result, "Availability checked");
});

exports.deleteBooking = asyncHandler(async (req, res) => {
  await roomBookingService.delete(req.params.id);
  ApiResponse.success(res, null, "Room booking deleted successfully");
});
