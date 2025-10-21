const db = require("../config/db");

/**
 * Get workflow tasks for a specific service
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getWorkflowTasks = async (req, res) => {
  try {
    const { dateString } = req.params;

    if (!dateString) {
      return res.status(400).json({ message: "dateString is required" });
    }

    // First get the service_assignment_id for the given date
    const serviceResult = await db.query(
      "SELECT id FROM service_assignments WHERE date_string = $1",
      [dateString]
    );

    if (serviceResult.rows.length === 0) {
      // If no service exists for this date, return empty tasks
      return res.json({
        dateString,
        tasks: {},
      });
    }

    const serviceId = serviceResult.rows[0].id;

    // Get all workflow tasks for this service
    const tasksResult = await db.query(
      `SELECT 
        wt.task_id, 
        wt.status, 
        wt.document_link, 
        wt.assigned_to,
        wt.updated_at,
        u.username as completed_by_name,
        u.avatar_url as completed_by_avatar,
        u.role as updated_by_role
      FROM workflow_tasks wt
      LEFT JOIN users u ON wt.completed_by = u.id
      WHERE wt.service_assignment_id = $1`,
      [serviceId]
    );

    // Transform into an object with task_id as keys
    const tasks = {};
    tasksResult.rows.forEach((task) => {
      tasks[task.task_id] = {
        status: task.status,
        documentLink: task.document_link,
        assignedTo: task.assigned_to,
        updatedAt: task.updated_at,
        updatedBy:
          task.updated_by_role ||
          task.assigned_to ||
          (task.completed_by_name ? "user" : null),
        completedBy: task.completed_by_name
          ? {
              name: task.completed_by_name,
              avatar: task.completed_by_avatar,
            }
          : null,
      };
    });

    res.json({
      dateString,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching workflow tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update a workflow task status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateTaskStatus = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, taskId } = req.params;
    const { status, documentLink } = req.body;

    if (!dateString || !taskId) {
      return res
        .status(400)
        .json({ message: "dateString and taskId are required" });
    }

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    await client.query("BEGIN");

    // First get or create the service_assignment_id
    const serviceResult = await client.query(
      `INSERT INTO service_assignments (date_string, title, status, days_until) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (date_string) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [dateString, "Sunday Service", "upcoming", 0]
    );

    const serviceId = serviceResult.rows[0].id;

    // Update or insert the task status
    await client.query(
      `INSERT INTO workflow_tasks (service_assignment_id, task_id, status, document_link, assigned_to, completed_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (service_assignment_id, task_id) 
       DO UPDATE SET 
         status = EXCLUDED.status, 
         document_link = EXCLUDED.document_link,
         completed_by = CASE WHEN EXCLUDED.status = 'completed' AND workflow_tasks.status != 'completed' THEN $6 ELSE workflow_tasks.completed_by END,
         updated_at = CURRENT_TIMESTAMP`,
      [
        serviceId,
        taskId,
        status,
        documentLink || null,
        req.body.assignedTo || null,
        status === "completed" ? req.user.id : null,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Task status updated successfully",
      taskId,
      status,
      dateString,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Get all workflow tasks for all services
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllWorkflowTasks = async (req, res) => {
  try {
    // Get all services with their workflow tasks
    const result = await db.query(
      `SELECT 
        sa.date_string,
        COALESCE(
          (SELECT json_object_agg(
            wt.task_id, 
            json_build_object(
              'status', wt.status,
              'documentLink', wt.document_link,
              'assignedTo', wt.assigned_to,
              'updatedAt', wt.updated_at,
              'completedBy', CASE WHEN u.id IS NOT NULL THEN 
                json_build_object('name', u.username, 'avatar', u.avatar_url)
              ELSE NULL END
            )
          )
          FROM workflow_tasks wt
          LEFT JOIN users u ON wt.completed_by = u.id
          WHERE wt.service_assignment_id = sa.id
          AND wt.task_id IS NOT NULL
          GROUP BY sa.id),
          '{}'::json
        ) as tasks
      FROM service_assignments sa
      ORDER BY sa.date_string`
    );

    // Transform into an array of services with their tasks
    const services = result.rows.map((row) => ({
      dateString: row.date_string,
      tasks: row.tasks || {},
    }));

    res.json(services);
  } catch (error) {
    console.error("Error fetching all workflow tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a workflow task
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteWorkflowTask = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, taskId } = req.params;

    if (!dateString || !taskId) {
      return res
        .status(400)
        .json({ message: "dateString and taskId are required" });
    }

    await client.query("BEGIN");

    // First get the service_assignment_id for the given date
    const serviceResult = await client.query(
      "SELECT id FROM service_assignments WHERE date_string = $1",
      [dateString]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const serviceId = serviceResult.rows[0].id;

    // Delete the task
    const deleteResult = await client.query(
      "DELETE FROM workflow_tasks WHERE service_assignment_id = $1 AND task_id = $2 RETURNING id",
      [serviceId, taskId]
    );

    await client.query("COMMIT");

    // Check if any row was deleted
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task deleted successfully",
      taskId,
      dateString,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting workflow task:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  getWorkflowTasks,
  updateTaskStatus,
  getAllWorkflowTasks,
  deleteWorkflowTask,
};
