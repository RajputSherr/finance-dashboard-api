const { FinancialRecord } = require("../models/FinancialRecord");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// GET /api/records — Viewer, Analyst, Admin
exports.getRecords = catchAsync(async (req, res) => {
  const { type, category, startDate, endDate, page = 1, limit = 20, sort = "-date" } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const allowedSortFields = ["date", "-date", "amount", "-amount", "createdAt", "-createdAt"];
  const sortField = allowedSortFields.includes(sort) ? sort : "-date";

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate("createdBy", "name email")
      .sort(sortField)
      .skip(skip)
      .limit(Number(limit)),
    FinancialRecord.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: records.length,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    data: { records },
  });
});

// GET /api/records/:id — Viewer, Analyst, Admin
exports.getRecordById = catchAsync(async (req, res, next) => {
  const record = await FinancialRecord.findById(req.params.id).populate("createdBy", "name email");
  if (!record) return next(new AppError("Record not found.", 404));

  res.status(200).json({ status: "success", data: { record } });
});

// POST /api/records — Analyst, Admin
exports.createRecord = catchAsync(async (req, res) => {
  const { amount, type, category, date, notes } = req.body;

  const record = await FinancialRecord.create({
    amount,
    type,
    category,
    date: date || new Date(),
    notes,
    createdBy: req.user._id,
  });

  res.status(201).json({ status: "success", data: { record } });
});

// PATCH /api/records/:id — Analyst, Admin
exports.updateRecord = catchAsync(async (req, res, next) => {
  const allowedFields = ["amount", "type", "category", "date", "notes"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const record = await FinancialRecord.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  if (!record) return next(new AppError("Record not found.", 404));

  res.status(200).json({ status: "success", data: { record } });
});

// DELETE /api/records/:id — Admin only (soft delete)
exports.deleteRecord = catchAsync(async (req, res, next) => {
  // Use findOneAndUpdate to bypass the pre-find isDeleted filter
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: req.params.id },
    { isDeleted: true },
    { new: true }
  );

  if (!record) return next(new AppError("Record not found.", 404));

  res.status(204).json({ status: "success", data: null });
});
