const roomService = require("../services/roomService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

exports.createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.create(req.body);
  ApiResponse.success(res, room, "Room created successfully", 201);
});

exports.updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.update(req.params.id, req.body);
  ApiResponse.success(res, room, "Room updated successfully");
});

exports.getAllRooms = asyncHandler(async (req, res) => {
  const { checkInDate, checkOutDate } = req.query;
  const rooms = await roomService.findAll(checkInDate, checkOutDate);
  ApiResponse.success(res, rooms, "Rooms retrieved successfully");
});

exports.deleteRoom = asyncHandler(async (req, res) => {
  await roomService.delete(req.params.id);
  ApiResponse.success(res, null, "Room deleted successfully");
});
