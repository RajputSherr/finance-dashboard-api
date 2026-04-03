const { FinancialRecord } = require("../models/FinancialRecord");
const catchAsync = require("../utils/catchAsync");

// GET /api/dashboard/summary — Viewer, Analyst, Admin
exports.getSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = { isDeleted: false };
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const summary = await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
      },
    },
  ]);

  const income = summary.find((s) => s._id === "income") || { total: 0, count: 0, avgAmount: 0 };
  const expense = summary.find((s) => s._id === "expense") || { total: 0, count: 0, avgAmount: 0 };

  res.status(200).json({
    status: "success",
    data: {
      totalIncome: income.total,
      totalExpenses: expense.total,
      netBalance: income.total - expense.total,
      incomeCount: income.count,
      expenseCount: expense.count,
      avgIncome: Math.round(income.avgAmount * 100) / 100,
      avgExpense: Math.round(expense.avgAmount * 100) / 100,
    },
  });
});

// GET /api/dashboard/category-breakdown — Analyst, Admin
exports.getCategoryBreakdown = catchAsync(async (req, res) => {
  const { type, startDate, endDate } = req.query;

  const matchStage = { isDeleted: false };
  if (type) matchStage.type = type;
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const breakdown = await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: "$_id.category",
        type: "$_id.type",
        total: 1,
        count: 1,
      },
    },
  ]);

  res.status(200).json({ status: "success", data: { breakdown } });
});

// GET /api/dashboard/trends — Analyst, Admin
exports.getTrends = catchAsync(async (req, res) => {
  const { period = "monthly", year } = req.query;
  const targetYear = year ? Number(year) : new Date().getFullYear();

  const matchStage = {
    isDeleted: false,
    date: {
      $gte: new Date(`${targetYear}-01-01`),
      $lte: new Date(`${targetYear}-12-31`),
    },
  };

  const groupBy =
    period === "weekly"
      ? { year: { $year: "$date" }, week: { $week: "$date" } }
      : { year: { $year: "$date" }, month: { $month: "$date" } };

  const trends = await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { ...groupBy, type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } },
    {
      $project: {
        _id: 0,
        period: period === "weekly" ? "$_id.week" : "$_id.month",
        year: "$_id.year",
        type: "$_id.type",
        total: 1,
        count: 1,
      },
    },
  ]);

  res.status(200).json({ status: "success", data: { period, year: targetYear, trends } });
});

// GET /api/dashboard/recent — Viewer, Analyst, Admin
exports.getRecentActivity = catchAsync(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const records = await FinancialRecord.find()
    .populate("createdBy", "name")
    .sort("-createdAt")
    .limit(limit);

  res.status(200).json({ status: "success", data: { records } });
});
