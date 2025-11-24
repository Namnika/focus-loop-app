const axios = require("axios");
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/daily-checkin", async (req, res) => {
    const { student_id, quiz_score, focus_minutes } = req.body;
    if (
        !student_id ||
        typeof quiz_score !== "number" ||
        typeof focus_minutes !== "number"
    ) {
        return res.status(400).json({ error: "invalid payload" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `INSERT INTO daily_logs(student_id, quiz_score, focus_minutes) VALUES($1,$2,$3)`,
            [student_id, quiz_score, focus_minutes]
        );

        if (quiz_score > 7 && focus_minutes > 60) {
            await client.query(
                `UPDATE students SET status='On Track', updated_at = now(), current_intervention_id = NULL WHERE id=$1`,
                [student_id]
            );
            await client.query("COMMIT");
            io.to(student_id).emit("status:update", { status: "On Track" });
            return res.json({ status: "On Track" });
        } else {
            await client.query(
                `UPDATE students SET status='Pending Mentor Review', updated_at = now() WHERE id=$1`,
                [student_id]
            );
            await client.query("COMMIT");

            const payload = {
                student_id,
                quiz_score,
                focus_minutes,
                timestamp: new Date().toISOString(),
            };
            if (process.env.N8N_WEBHOOK_URL) {
                try {
                    await axios.post(process.env.N8N_WEBHOOK_URL, payload);
                } catch (e) {
                    console.warn("n8n call failed", e.message);
                }
            }

            io.to(student_id).emit("status:update", {
                status: "Pending Mentor Review",
            });
            return res.json({ status: "Pending Mentor Review" });
        }
    } catch (err) {
        await client.query("ROLLBACK").catch(() => { });
        console.error(err);
        return res.status(500).json({ error: "server error" });
    } finally {
        client.release();
    }
});

module.exports = router;