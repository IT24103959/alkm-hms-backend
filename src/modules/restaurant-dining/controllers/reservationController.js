const TableReservation = require("../models/TableReservation");
const MenuItem = require("../models/MenuItem");
const asyncHandler = require("../../../utils/asyncHandler");
const AppError = require("../../../middleware/error.middleware");
const ApiResponse = require("../../../utils/apiResponse");

// GET /api/v1/restaurant/reservations
exports.getReservations = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.reservationDate = { $gte: start, $lt: end };
  }
  const reservations = await TableReservation.find(filter)
    .populate("orderedItems.menuItem", "name price")
    .sort({ reservationDate: 1, reservationTime: 1 });
  ApiResponse.success(res, { reservations }, "Reservations retrieved successfully");
});

// GET /api/v1/restaurant/reservations/:id
exports.getReservation = asyncHandler(async (req, res, next) => {
  const reservation = await TableReservation.findById(req.params.id)
    .populate("orderedItems.menuItem", "name price");
  if (!reservation) return next(new AppError("Reservation not found", 404));
  ApiResponse.success(res, { reservation }, "Reservation retrieved successfully");
});

// POST /api/v1/restaurant/reservations
exports.createReservation = asyncHandler(async (req, res) => {
  const {
    customerName, customerPhone, customerEmail,
    tableNumber, guestCount, reservationDate, reservationTime,
    specialRequests, orderedItems,
  } = req.body;

  // Calculate total from ordered items if any
  let totalAmount = 0;
  const resolvedItems = [];
  if (orderedItems && orderedItems.length > 0) {
    for (const entry of orderedItems) {
      const menuItem = await MenuItem.findById(entry.menuItem);
      if (menuItem) {
        resolvedItems.push({
          menuItem: menuItem._id,
          quantity: entry.quantity || 1,
          itemName: menuItem.name,
          itemPrice: menuItem.price,
        });
        totalAmount += menuItem.price * (entry.quantity || 1);
      }
    }
  }

  const reservation = await TableReservation.create({
    customerName, customerPhone, customerEmail,
    tableNumber, guestCount, reservationDate, reservationTime,
    specialRequests, orderedItems: resolvedItems, totalAmount,
  });

  ApiResponse.success(res, { reservation }, "Reservation created successfully", 201);
});

// PATCH /api/v1/restaurant/reservations/:id
exports.updateReservation = asyncHandler(async (req, res, next) => {
  const reservation = await TableReservation.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!reservation) return next(new AppError("Reservation not found", 404));
  ApiResponse.success(res, { reservation }, "Reservation updated successfully");
});

// DELETE /api/v1/restaurant/reservations/:id
exports.deleteReservation = asyncHandler(async (req, res, next) => {
  const reservation = await TableReservation.findByIdAndDelete(req.params.id);
  if (!reservation) return next(new AppError("Reservation not found", 404));
  ApiResponse.success(res, null, "Reservation deleted successfully");
});
