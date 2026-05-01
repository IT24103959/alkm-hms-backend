const maintenanceService = require("../services/maintenanceService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

/**
 * @desc    Check if room has active maintenance (public endpoint)
 * @route   GET /api/v1/maintenance/check-room/:roomNumber
 * @access  Public
 */
exports.checkRoom = asyncHandler(async (req, res) => {
  const result = await maintenanceService.hasActiveMaintenance(
    req.params.roomNumber,
  );

  ApiResponse.success(res, result, "Room check completed");
});

/**
 * @desc    Create a new maintenance ticket
 * @route   POST /api/v1/maintenance
 * @access  Private - SUPER_ADMIN, MANAGER
 */
exports.createTicket = asyncHandler(async (req, res) => {
  const ticket = await maintenanceService.create(req.body);

  ApiResponse.success(
    res,
    ticket,
    "Maintenance ticket created successfully",
    201,
  );
});

/**
 * @desc    Get all maintenance tickets
 * @route   GET /api/v1/maintenance
 * @access  Private - SUPER_ADMIN, MANAGER, MAINTENANCE_STAFF
 */
exports.getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await maintenanceService.findAll(req.user);

  ApiResponse.success(
    res,
    tickets,
    "Maintenance tickets retrieved successfully",
  );
});

/**
 * @desc    Get maintenance statistics
 * @route   GET /api/v1/maintenance/stats
 * @access  Private - SUPER_ADMIN, MANAGER, HOUSEKEEPER, MAINTENANCE_STAFF
 */
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await maintenanceService.getStats();

  ApiResponse.success(res, stats, "Statistics retrieved successfully");
});

/**
 * @desc    Get a single maintenance ticket
 * @route   GET /api/v1/maintenance/:id
 * @access  Private - SUPER_ADMIN, MANAGER, MAINTENANCE_STAFF
 */
exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await maintenanceService.findOne(req.params.id);

  ApiResponse.success(res, ticket, "Maintenance ticket retrieved successfully");
});

/**
 * @desc    Update a maintenance ticket
 * @route   PUT /api/v1/maintenance/:id
 * @access  Private - SUPER_ADMIN, MANAGER
 */
exports.updateTicket = asyncHandler(async (req, res) => {
  const ticket = await maintenanceService.update(req.params.id, req.body);

  ApiResponse.success(res, ticket, "Maintenance ticket updated successfully");
});

/**
 * @desc    Update ticket status
 * @route   PATCH /api/v1/maintenance/:id/status
 * @access  Private - MAINTENANCE_STAFF
 */
exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await maintenanceService.updateStatus(
    req.params.id,
    status,
    req.user,
  );

  ApiResponse.success(res, ticket, "Ticket status updated successfully");
});

/**
 * @desc    Add resolution details (notes and parts used)
 * @route   PATCH /api/v1/maintenance/:id/resolution
 * @access  Private - MAINTENANCE_STAFF
 */
exports.addResolutionDetails = asyncHandler(async (req, res) => {
  const ticket = await maintenanceService.addResolutionDetails(
    req.params.id,
    req.body,
    req.user,
  );

  ApiResponse.success(res, ticket, "Resolution details added successfully");
});

/**
 * @desc    Delete a maintenance ticket
 * @route   DELETE /api/v1/maintenance/:id
 * @access  Private - SUPER_ADMIN, MANAGER
 */
exports.deleteTicket = asyncHandler(async (req, res) => {
  await maintenanceService.delete(req.params.id);

  ApiResponse.success(res, null, "Maintenance ticket deleted successfully");
});
