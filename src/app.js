const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "HMS Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes - will be imported from modules
app.use("/api/v1/auth", require("./routes/authRoutes"));

// API routes for housekeeping and maintenance modules
app.use(
  "/api/v1/housekeeping",
  require("./modules/housekeeping-maintenance/routes/housekeepingRoutes"),
);
app.use(
  "/api/v1/maintenance",
  require("./modules/housekeeping-maintenance/routes/maintenanceRoutes"),
);

// Room Management
app.use(
  "/api/v1/rooms",
  require("./modules/room-management/routes/roomRoutes"),
);
app.use(
  "/api/v1/room-bookings",
  require("./modules/room-management/routes/roomBookingRoutes"),
);

// Payroll Management
app.use(
  "/api/v1/payroll",
  require("./modules/user-payroll/routes/payrollRoutes"),
);

// Restaurant & Dining
app.use(
  "/api/v1/restaurant",
  require("./modules/restaurant-dining/routes/restaurantRoutes"),
);

// Event Management
app.use(
  "/api/v1/events",
  require("./modules/event-management/routes/eventBookingRoutes"),
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

module.exports = app;
