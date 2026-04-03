const express = require("express");
const router = express.Router();
const recordController = require("../controllers/recordController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { recordValidators } = require("../middleware/validators");

// All record routes require authentication
router.use(authenticate);

// Viewer, Analyst, Admin — read access
router.get("/", authorize("viewer", "analyst", "admin"), recordValidators.list, recordController.getRecords);
router.get("/:id", authorize("viewer", "analyst", "admin"), recordController.getRecordById);

// Analyst, Admin — create and update
router.post("/", authorize("analyst", "admin"), recordValidators.create, recordController.createRecord);
router.patch("/:id", authorize("analyst", "admin"), recordValidators.update, recordController.updateRecord);

// Admin only — delete (soft)
router.delete("/:id", authorize("admin"), recordController.deleteRecord);

module.exports = router;
