const { body, query, param, validationResult } = require("express-validator");
const { CATEGORIES } = require("../models/FinancialRecord");

// Reusable handler - run after validators
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const authValidators = {
  register: [
    body("name").trim().notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["viewer", "analyst", "admin"])
      .withMessage("Role must be viewer, analyst, or admin"),
    validate,
  ],
  login: [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
};

const userValidators = {
  updateRole: [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("role")
      .isIn(["viewer", "analyst", "admin"])
      .withMessage("Role must be viewer, analyst, or admin"),
    validate,
  ],
  updateStatus: [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("status")
      .isIn(["active", "inactive"])
      .withMessage("Status must be active or inactive"),
    validate,
  ],
};

const recordValidators = {
  create: [
    body("amount")
      .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
    body("type")
      .isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("category")
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("date")
      .optional()
      .isISO8601().withMessage("Date must be a valid ISO date"),
    body("notes")
      .optional()
      .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
    validate,
  ],
  update: [
    param("id").isMongoId().withMessage("Invalid record ID"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
    body("type")
      .optional()
      .isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("category")
      .optional()
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("date")
      .optional()
      .isISO8601().withMessage("Date must be a valid ISO date"),
    body("notes")
      .optional()
      .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
    validate,
  ],
  list: [
    query("type").optional().isIn(["income", "expense"]).withMessage("Invalid type filter"),
    query("category").optional().isIn(CATEGORIES).withMessage("Invalid category filter"),
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO date"),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO date"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    validate,
  ],
};

module.exports = { authValidators, userValidators, recordValidators };
