const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.use(authenticate);

// Viewer, Analyst, Admin — basic summary and recent activity
router.get("/summary", authorize("viewer", "analyst", "admin"), dashboardController.getSummary);
router.get("/recent", authorize("viewer", "analyst", "admin"), dashboardController.getRecentActivity);

// Analyst, Admin — deeper analytics
router.get("/category-breakdown", authorize("analyst", "admin"), dashboardController.getCategoryBreakdown);
router.get("/trends", authorize("analyst", "admin"), dashboardController.getTrends);

module.exports = router;
