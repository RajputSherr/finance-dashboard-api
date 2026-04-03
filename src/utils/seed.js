require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("../models/User");
const { FinancialRecord } = require("../models/FinancialRecord");
const connectDB = require("../config/db");

const SEED_USERS = [
  { name: "Alice Admin", email: "admin@demo.com", password: "password123", role: "admin" },
  { name: "Ana Analyst", email: "analyst@demo.com", password: "password123", role: "analyst" },
  { name: "Victor Viewer", email: "viewer@demo.com", password: "password123", role: "viewer" },
];

const randomBetween = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const INCOME_CATEGORIES = ["salary", "freelance", "investment", "rental", "bonus"];
const EXPENSE_CATEGORIES = [
  "food", "transport", "utilities", "healthcare",
  "entertainment", "education", "shopping", "rent", "insurance", "other",
];

const generateRecords = (userId) => {
  const records = [];
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);

  // Generate 60 records spread over the past year
  for (let i = 0; i < 60; i++) {
    const isIncome = Math.random() > 0.45;
    records.push({
      amount: isIncome ? randomBetween(500, 8000) : randomBetween(50, 2000),
      type: isIncome ? "income" : "expense",
      category: isIncome ? randomItem(INCOME_CATEGORIES) : randomItem(EXPENSE_CATEGORIES),
      date: randomDate(yearAgo, now),
      notes: isIncome ? "Monthly income entry" : "Regular expense",
      createdBy: userId,
    });
  }
  return records;
};

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log("Cleared existing data");

    // Create users
    const createdUsers = [];
    for (const userData of SEED_USERS) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    // Create financial records owned by the admin user
    const adminUser = createdUsers.find((u) => u.role === "admin");
    const records = generateRecords(adminUser._id);
    await FinancialRecord.insertMany(records);
    console.log(`Created ${records.length} financial records`);

    console.log("\n✅ Seed complete! Demo credentials:");
    SEED_USERS.forEach((u) => {
      console.log(`  ${u.role.padEnd(8)} → ${u.email} / ${u.password}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
