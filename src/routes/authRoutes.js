const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const { authValidators } = require("../middleware/validators");

router.post("/register", authValidators.register, authController.register);
router.post("/login", authValidators.login, authController.login);
router.get("/me", authenticate, authController.getMe);

module.exports = router;
