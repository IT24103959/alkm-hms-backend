const reservationService = require("../services/reservationService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

exports.createReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.create(
    req.body,
    req.user.username,
  );
  ApiResponse.success(
    res,
    reservation,
    "Reservation created successfully",
    201,
  );
});

exports.getAllReservations = asyncHandler(async (req, res) => {
  const reservations = await reservationService.findAll();
  ApiResponse.success(res, reservations, "Reservations retrieved successfully");
});

exports.getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await reservationService.findMine(req.user.username);
  ApiResponse.success(
    res,
    reservations,
    "Your reservations retrieved successfully",
  );
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const reservation = await reservationService.updateStatus(
    req.params.id,
    status,
  );
  ApiResponse.success(res, reservation, "Reservation status updated");
});

exports.assignTable = asyncHandler(async (req, res) => {
  const { assignedTable } = req.body;
  const reservation = await reservationService.assignTable(
    req.params.id,
    assignedTable,
  );
  ApiResponse.success(res, reservation, "Table assigned successfully");
});

exports.cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.cancel(req.params.id);
  ApiResponse.success(res, reservation, "Reservation cancelled successfully");
});
