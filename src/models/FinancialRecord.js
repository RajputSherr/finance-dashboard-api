const mongoose = require("mongoose");

const TYPES = { INCOME: "income", EXPENSE: "expense" };

const CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "rental",
  "bonus",
  "food",
  "transport",
  "utilities",
  "healthcare",
  "entertainment",
  "education",
  "shopping",
  "rent",
  "insurance",
  "other",
];

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: Object.values(TYPES),
      required: [true, "Type is required (income or expense)"],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Always exclude soft-deleted records by default
financialRecordSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

// Indexes for common filter queries
financialRecordSchema.index({ type: 1, date: -1 });
financialRecordSchema.index({ category: 1, date: -1 });
financialRecordSchema.index({ date: -1 });

const FinancialRecord = mongoose.model(
  "FinancialRecord",
  financialRecordSchema
);

module.exports = { FinancialRecord, TYPES, CATEGORIES };
