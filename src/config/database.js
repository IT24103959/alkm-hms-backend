const mongoose = require("mongoose");
const dns = require("dns");
const User = require("../models/User");

// Use a public DNS resolver when the local environment refuses SRV queries.
// This helps MongoDB Atlas SRV connections work on Windows / restricted networks.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const getMongoConnectionHelp = (mongoUri, error) => {
  if (!mongoUri) {
    return "Set MONGODB_URI in your .env file before starting the server.";
  }

  if (
    error.code === "ENOTFOUND" ||
    error.code === "ECONNREFUSED" ||
    error.message.includes("querySrv")
  ) {
    return [
      "MongoDB Atlas DNS lookup failed.",
      "Copy a fresh connection string from Atlas and update MONGODB_URI.",
      "Verify the Atlas cluster is active and your IP is allowed in Network Access.",
      "If the URI is current, switch your machine DNS to 8.8.8.8 or 1.1.1.1 and retry.",
    ].join(" ");
  }

  if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
    return "MongoDB authentication failed. Verify the Atlas username and password in MONGODB_URI.";
  }

  return "Check that MONGODB_URI is valid and that the MongoDB server is reachable from this machine.";
};

const ensureDefaultAdmin = async () => {
  const username = (process.env.DEFAULT_ADMIN_USERNAME || "superadmin").trim();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Password@123";
  const fullName = (process.env.DEFAULT_ADMIN_FULL_NAME || "Super Admin").trim();

  if (!username || !password || !fullName) {
    console.warn("⚠️ Default admin bootstrap skipped: incomplete default admin configuration.");
    return;
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    console.log(`ℹ️ Default admin already exists: ${username}`);
    return;
  }

  await User.create({
    username,
    password,
    fullName,
    role: "SUPER_ADMIN",
  });

  console.log(`✅ Default admin created: ${username}`);
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("❌ MongoDB connection skipped: MONGODB_URI is not set.");
    console.error("   Set MONGODB_URI in .env and restart the server.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    await ensureDefaultAdmin();

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error(`   ${getMongoConnectionHelp(mongoUri, error)}`);
    process.exit(1);
  }
};

module.exports = connectDB;
