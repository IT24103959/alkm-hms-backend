const User = require("../../../models/User");
const AppError = require("../../../middleware/error.middleware");

const STAFF_ROLES = [
  "STAFF_MEMBER",
  "HOUSEKEEPER",
  "MAINTENANCE_STAFF",
  "RESTAURANT_MANAGER",
  "EVENT_MANAGER",
  "MANAGER",
];

class StaffService {
  /**
   * Create a User with staff payroll fields
   */
  async create(staffData) {
    const {
      username,
      password,
      name,
      role = "STAFF_MEMBER",
      position,
      basicSalary,
      attendance,
      overtimeHours,
      absentDays,
      overtimeRate,
      dailyRate,
    } = staffData;

    if (!username || !password) {
      throw new AppError("Username and password are required", 400);
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError("A user with this username already exists", 400);
    }

    const user = await User.create({
      username,
      password,
      fullName: name,
      role: position,
      position,
      basicSalary,
      attendance,
      overtimeHours,
      absentDays,
      overtimeRate,
      dailyRate,
    });
    return this._toResponse(user);
  }

  /**
   * Update a staff user's details
   */
  async update(id, staffData) {
    const {
      name,
      role,
      position,
      basicSalary,
      attendance,
      overtimeHours,
      absentDays,
      overtimeRate,
      dailyRate,
    } = staffData;

    const user = await User.findByIdAndUpdate(
      id,
      {
        fullName: name,
        role: position,
        position,
        basicSalary,
        attendance,
        overtimeHours,
        absentDays,
        overtimeRate,
        dailyRate,
      },
      { new: true, runValidators: true },
    );
    if (!user) {
      throw new AppError("Staff member not found", 404);
    }
    return this._toResponse(user);
  }

  async getById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError("Staff member not found", 404);
    }
    return this._toResponse(user);
  }

  async getAll({ name, role, page = 0, size = 10 }) {
    const query = {
      enabled: true,
      role: role ? role : { $in: STAFF_ROLES },
    };
    if (name) {
      query.fullName = { $regex: name, $options: "i" };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ fullName: 1 })
      .skip(page * size)
      .limit(size);

    return {
      content: users.map((u) => this._toResponse(u)),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  _toResponse(user) {
    return {
      _id: user._id,
      username: user.username,
      name: user.fullName,
      role: user.role,
      enabled: user.enabled,
      position: user.position,
      basicSalary: user.basicSalary,
      attendance: user.attendance,
      overtimeHours: user.overtimeHours,
      absentDays: user.absentDays,
      overtimeRate: user.overtimeRate,
      dailyRate: user.dailyRate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Soft delete — disables the user account
   */
  async softDelete(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { enabled: false },
      { new: true },
    );
    if (!user) {
      throw new AppError("Staff member not found", 404);
    }
  }
}

module.exports = new StaffService();
