const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { userValidators } = require("../middleware/validators");

// All user management routes require authentication and admin role
router.use(authenticate, authorize("admin"));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id/role", userValidators.updateRole, userController.updateUserRole);
router.patch("/:id/status", userValidators.updateStatus, userController.updateUserStatus);
router.delete("/:id", userController.deleteUser);

module.exports = router;
