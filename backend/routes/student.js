const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/:id/status", async (req, res) => {
    const { id } = req.params;
    const r = await pool.query(
        `SELECT s.id, s.name, s.status, s.current_intervention_id, i.task
     FROM students s LEFT JOIN interventions i ON s.current_intervention_id = i.id
     WHERE s.id = $1`,
        [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "not found" });
    return res.json(r.rows[0]);
});

module.exports = router;