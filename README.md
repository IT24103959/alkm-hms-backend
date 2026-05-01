# Hotel Management System - Backend API

A comprehensive backend API for hotel management built with Node.js, Express, and MongoDB.

## 🏗️ Project Structure

```
hms-be/
├── docs/                   # Documentation
│   └── AUTHENTICATION.md   # Authentication guide
├── src/
│   ├── config/              # Configuration files
│   │   └── database.js      # MongoDB connection setup
│   ├── models/              # Mongoose models
│   │   └── User.js          # User model
│   ├── controllers/         # Route controllers
│   │   └── authController.js # Authentication controllers
│   ├── routes/              # API routes
│   │   ├── authRoutes.js    # Authentication routes
│   │   └── exampleProtectedRoutes.js # Example protected routes
│   ├── modules/             # Feature modules
│   │   ├── user-payroll/           # User & Payroll Management
│   │   ├── restaurant-dining/      # Restaurant & Dining Management
│   │   ├── room-management/        # Room Management
│   │   ├── event-management/       # Event Management
│   │   └── housekeeping-maintenance/ # Housekeeping & Maintenance
│   ├── middleware/          # Custom middleware
│   │   ├── auth.middleware.js      # JWT authentication
│   │   ├── authorization.middleware.js # Role-based access control
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── utils/              # Utility functions
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── jwtUtils.js      # JWT utilities
│   │   └── logger.js
│   └── app.js              # Express app configuration
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
├── server.js              # Application entry point
└── README.md              # This file
```

## 📋 Core Modules

1. **User Management & Payroll** - Staff management, payroll processing, attendance tracking
2. **Restaurant & Dining** - Menu management, table reservations, order tracking, inventory
3. **Room Management** - Room availability, bookings, dynamic pricing, analytics
4. **Event Management** - Event bookings, hall allocation, package management
5. **Housekeeping & Maintenance** - Task management, maintenance tickets, SLA monitoring

## 🔐 Authentication & Authorization

Fully implemented JWT-based authentication system with:

- ✅ User registration and login
- ✅ JWT token generation and verification
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Protected routes middleware
- ✅ Profile management
- ✅ Password change functionality
- ✅ Multiple authentication methods (Bearer token & cookies)

### User Roles
- `SUPER_ADMIN` - Full system access
- `MANAGER` - Management level access
- `STAFF_MEMBER` - General staff access
- `CUSTOMER` - Customer/guest access
- `RESTAURANT_MANAGER` - Restaurant operations management
- `EVENT_MANAGER` - Event management
- `HOUSEKEEPER` - Housekeeping operations
- `MAINTENANCE_STAFF` - Maintenance operations

**Note:** User schema matches the Spring Boot backend for consistency.

**📖 Complete authentication guide:** [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)
**📖 Schema update documentation:** [docs/SCHEMA_UPDATE.md](docs/SCHEMA_UPDATE.md)

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
cd hms-be
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start MongoDB service

5. Run the application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🔧 Environment Variables

See `.env.example` for required environment variables:
- `NODE_ENV` - Application environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (use a strong, random string)
- `JWT_EXPIRE` - JWT token expiration time (e.g., 7d)
- `JWT_COOKIE_EXPIRE` - Cookie expiration in days (e.g., 7)

**Important:** Always use a strong, random `JWT_SECRET` in production!

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile (protected)
- `PUT /api/v1/auth/update-profile` - Update user profile (protected)
- `PUT /api/v1/auth/change-password` - Change password (protected)
- `POST /api/v1/auth/logout` - Logout user (protected)
- `GET /api/v1/auth/users` - Get all users (admin only)
- `GET /api/v1/auth/users/:id` - Get single user (admin only)
- `PUT /api/v1/auth/users/:id` - Update user (admin only)
- `DELETE /api/v1/auth/users/:id` - Delete user (admin only)

📖 **Detailed documentation:** [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)

### Housekeeping
- `POST /api/v1/housekeeping` - Create housekeeping task (admin/manager)
- `POST /api/v1/housekeeping/booking-trigger` - Create task from booking (all authenticated)
- `GET /api/v1/housekeeping` - Get all tasks (admin/manager/housekeeper)
- `GET /api/v1/housekeeping/stats` - Get statistics (admin/manager/housekeeper/maintenance)
- `GET /api/v1/housekeeping/:id` - Get single task (admin/manager/housekeeper)
- `PUT /api/v1/housekeeping/:id` - Update task (admin/manager)
- `PATCH /api/v1/housekeeping/:id/status` - Update status (housekeeper)
- `PATCH /api/v1/housekeeping/:id/notes` - Add cleaning notes (housekeeper)
- `DELETE /api/v1/housekeeping/:id` - Delete task (admin/manager)

### Maintenance
- `GET /api/v1/maintenance/check-room/:roomNumber` - Check room availability (public)
- `POST /api/v1/maintenance` - Create maintenance ticket (admin/manager)
- `GET /api/v1/maintenance` - Get all tickets (admin/manager/maintenance staff)
- `GET /api/v1/maintenance/stats` - Get statistics (admin/manager/housekeeper/maintenance)
- `GET /api/v1/maintenance/:id` - Get single ticket (admin/manager/maintenance staff)
- `PUT /api/v1/maintenance/:id` - Update ticket (admin/manager)
- `PATCH /api/v1/maintenance/:id/status` - Update status (maintenance staff)
- `PATCH /api/v1/maintenance/:id/resolution` - Add resolution details (maintenance staff)
- `DELETE /api/v1/maintenance/:id` - Delete ticket (admin/manager)

📖 **Detailed documentation:** [docs/HOUSEKEEPING_MAINTENANCE_API.md](docs/HOUSEKEEPING_MAINTENANCE_API.md)

### Health Check
- `GET /health` - Check API status

*More endpoints will be added as other modules are implemented.*

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: Multer
- **Cookies**: cookie-parser
- **Logging**: Morgan

## 📝 Development Guidelines

- Each module follows MVC-like architecture (Models, Controllers, Services, Routes)
- Use async/await for asynchronous operations
- Implement proper error handling with try-catch blocks
- Follow RESTful API conventions
- Write clean, maintainable code with proper comments

## 🧪 Testing

Testing implementation coming soon.

## 📄 License

ISC

## 👥 Contributors

Hotel Management Team
