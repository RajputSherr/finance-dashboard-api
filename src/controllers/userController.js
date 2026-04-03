const { User } = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// GET /api/users — Admin only
exports.getAllUsers = catchAsync(async (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    data: { users },
  });
});

// GET /api/users/:id — Admin only
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));

  res.status(200).json({ status: "success", data: { user } });
});

// PATCH /api/users/:id/role — Admin only
exports.updateUserRole = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user.id.toString()) {
    return next(new AppError("You cannot change your own role.", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  );
  if (!user) return next(new AppError("User not found.", 404));

  res.status(200).json({ status: "success", data: { user } });
});

// PATCH /api/users/:id/status — Admin only
exports.updateUserStatus = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user.id.toString()) {
    return next(new AppError("You cannot deactivate your own account.", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!user) return next(new AppError("User not found.", 404));

  res.status(200).json({ status: "success", data: { user } });
});

// DELETE /api/users/:id — Admin only
exports.deleteUser = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user.id.toString()) {
    return next(new AppError("You cannot delete your own account.", 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));

  res.status(204).json({ status: "success", data: null });
});
