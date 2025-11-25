const axios = require("axios");
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/assign-intervention", async (req, res) => {
    const student_id = req.body?.student_id || req.query.student_id;
    const task = req.body?.task || req.query.task;
    const assigned_by = req.body?.assigned_by || req.query.assigned_by;

    if (!student_id || !task)
        return res.status(400).json({ error: "missing fields" });

    const io = req.io; 
    const client = await pool.connect();
    try {
        console.log("DATA:", student_id, task, assigned_by);
        await client.query("BEGIN");

        const create = await client.query(
            `INSERT INTO interventions(student_id, task, assigned_by) VALUES($1,$2,$3) RETURNING id`,
            [student_id, task, assigned_by || "mentor"]
        );
        const interventionId = create.rows[0].id;
        await client.query(
            `UPDATE students SET status='Remedial', current_intervention_id=$1, updated_at = now() WHERE id=$2`,
            [interventionId, student_id]
        );
        await client.query("COMMIT");

        io.to(student_id).emit("status:update", {
            status: "Remedial",
            intervention: { id: interventionId, task },
        });

        io.emit("intervention-assigned", {
            student_id,
            task,
        });

        console.log("SOCKET EVENT SENT");

        return res.json({
            status: "In Intervention",
            intervention_id: interventionId,
            task: task
        });
    } catch (err) {
        await client.query("ROLLBACK").catch(() => { });
        console.error(err);
        return res.status(500).json({ error: "server error" });
    } finally {
        client.release();
    }
});

router.post("/complete-intervention", async (req, res) => {
    const { student_id, intervention_id } = req.body;
    if (!student_id || !intervention_id)
        return res.status(400).json({ error: "missing" });

    const io = req.io; 
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `UPDATE interventions SET completed = true, completed_at = now() WHERE id = $1 AND student_id = $2`,
            [intervention_id, student_id]
        );
        await client.query(
            `UPDATE students SET status = 'On Track', current_intervention_id = NULL, updated_at = now() WHERE id = $1`,
            [student_id]
        );
        await client.query("COMMIT");

        io.to(student_id).emit("status:update", { status: "On Track" });
        return res.json({ ok: true });
    } catch (err) {
        await client.query("ROLLBACK").catch(() => { });
        console.error(err);
        return res.status(500).json({ error: "server error" });
    } finally {
        client.release();
    }
});

module.exports = router;