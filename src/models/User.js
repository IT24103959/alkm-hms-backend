const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    fullName: {
      type: String,
      required: [true, "Please provide a full name"],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "MANAGER",
        "STAFF_MEMBER",
        "CUSTOMER",
        "RESTAURANT_MANAGER",
        "EVENT_MANAGER",
        "HOUSEKEEPER",
        "MAINTENANCE_STAFF",
      ],
      required: [true, "Please provide a role"],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Staff / payroll fields (only populated for staff roles)
    position: {
      type: String,
      default: null,
      trim: true,
    },
    basicSalary: {
      type: Number,
      default: 0,
    },
    attendance: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
    },
    dailyRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // This creates createdAt and updatedAt
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
