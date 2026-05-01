const housekeepingService = require("../services/housekeepingService");
const asyncHandler = require("../../../utils/asyncHandler");
const ApiResponse = require("../../../utils/apiResponse");

/**
 * @desc    Create a new housekeeping task
 * @route   POST /api/v1/housekeeping
 * @access  Private - SUPER_ADMIN, MANAGER
 */
exports.createTask = asyncHandler(async (req, res) => {
  const task = await housekeepingService.create(req.body);

  ApiResponse.success(res, task, "Housekeeping task created successfully", 201);
});

/**
 * @desc    Create housekeeping task from booking trigger
 * @route   POST /api/v1/housekeeping/booking-trigger
 * @access  Private - All authenticated users
 */
exports.createFromBooking = asyncHandler(async (req, res) => {
  const task = await housekeepingService.createFromBooking(req.body);

  ApiResponse.success(res, task, "Housekeeping task created from booking", 201);
});

/**
 * @desc    Get all housekeeping tasks
 * @route   GET /api/v1/housekeeping
 * @access  Private - SUPER_ADMIN, MANAGER, HOUSEKEEPER
 */
exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await housekeepingService.findAll(req.user);

  ApiResponse.success(res, tasks, "Housekeeping tasks retrieved successfully");
});

/**
 * @desc    Get housekeeping statistics
 * @route   GET /api/v1/housekeeping/stats
 * @access  Private - SUPER_ADMIN, MANAGER, HOUSEKEEPER, MAINTENANCE_STAFF
 */
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await housekeepingService.getStats();

  ApiResponse.success(res, stats, "Statistics retrieved successfully");
});

/**
 * @desc    Get a single housekeeping task
 * @route   GET /api/v1/housekeeping/:id
 * @access  Private - SUPER_ADMIN, MANAGER, HOUSEKEEPER
 */
exports.getTask = asyncHandler(async (req, res) => {
  const task = await housekeepingService.findOne(req.params.id);

  ApiResponse.success(res, task, "Housekeeping task retrieved successfully");
});

/**
 * @desc    Update a housekeeping task
 * @route   PUT /api/v1/housekeeping/:id
 * @access  Private - SUPER_ADMIN, MANAGER
 */
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await housekeepingService.update(req.params.id, req.body);

  ApiResponse.success(res, task, "Housekeeping task updated successfully");
});

/**
 * @desc    Update task status
 * @route   PATCH /api/v1/housekeeping/:id/status
 * @access  Private - HOUSEKEEPER
 */
exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await housekeepingService.updateStatus(
    req.params.id,
    status,
    req.user,
  );

  ApiResponse.success(res, task, "Task status updated successfully");
});

/**
 * @desc    Add cleaning notes
 * @route   PATCH /api/v1/housekeeping/:id/notes
 * @access  Private - HOUSEKEEPER
 */
exports.addCleaningNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const task = await housekeepingService.addCleaningNotes(
    req.params.id,
    notes,
    req.user,
  );

  ApiResponse.success(res, task, "Cleaning notes added successfully");
});

/**
 * @desc    Delete a housekeeping task
 * @route   DELETE /api/v1/housekeeping/:id
 * @access  Private - SUPER_ADMIN, MANAGER
 */
exports.deleteTask = asyncHandler(async (req, res) => {
  await housekeepingService.delete(req.params.id);

  ApiResponse.success(res, null, "Housekeeping task deleted successfully");
});
