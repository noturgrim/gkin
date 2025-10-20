const express = require("express");
const router = express.Router();
const workflowController = require("../controllers/workflowController");
const authMiddleware = require("../middleware/auth");

/**
 * Workflow routes
 * All routes are protected by authentication middleware
 */

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get all workflow tasks for all services
router.get("/", workflowController.getAllWorkflowTasks);

// Get workflow tasks for a specific service
router.get("/:dateString", workflowController.getWorkflowTasks);

// Update a task status
router.put("/:dateString/:taskId", workflowController.updateTaskStatus);

module.exports = router;
