/**
 * Seed Script: Create Default Customer Account
 * Run: node scripts/seedCustomer.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const seedCustomer = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Import after connection to avoid schema registration issues
  const User = require("../src/models/User");

  const existing = await User.findOne({ username: "customer" });
  if (existing) {
    console.log("ℹ️  Customer already exists:", existing.username);
    process.exit(0);
  }

  const customer = await User.create({
    username: "customer",
    password: "customer123",
    fullName: "Hotel Guest",
    role: "CUSTOMER",
    enabled: true,
  });

  console.log("✅ Default customer created:");
  console.log("   Username : customer");
  console.log("   Password : customer123");
  console.log("   Full Name:", customer.fullName);
  process.exit(0);
};

seedCustomer().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
