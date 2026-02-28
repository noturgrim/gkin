const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /api/public/schedule
 * Returns all service assignments — no authentication required.
 * Optional query params:
 *   ?from=YYYY-MM-DD  (default: 3 months ago)
 *   ?to=YYYY-MM-DD    (default: 6 months from now)
 */
router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;

    // Default window: 3 months back → 6 months forward from today
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setMonth(defaultFrom.getMonth() - 3);
    const defaultTo = new Date(today);
    defaultTo.setMonth(defaultTo.getMonth() + 6);

    const fromDate = from || defaultFrom.toISOString().slice(0, 10);
    const toDate = to || defaultTo.toISOString().slice(0, 10);

    const query = `
      SELECT
        sa.date_string,
        sa.title,
        COALESCE(
          json_agg(
            json_build_object(
              'role', ar.role,
              'person', ar.person
            ) ORDER BY ar.role_order, ar.id
          ) FILTER (WHERE ar.id IS NOT NULL),
          '[]'::json
        ) AS assignments
      FROM service_assignments sa
      LEFT JOIN assignment_roles ar ON sa.id = ar.service_assignment_id
      WHERE sa.date_string >= $1 AND sa.date_string <= $2
      GROUP BY sa.id, sa.date_string, sa.title
      ORDER BY sa.date_string
    `;

    const result = await db.query(query, [fromDate, toDate]);

    const data = result.rows.map((row) => ({
      dateString: row.date_string,
      title: row.title,
      assignments: row.assignments,
    }));

    res.json(data);
  } catch (error) {
    console.error("Error fetching public schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
