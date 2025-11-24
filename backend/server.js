require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  const sql = require("fs").readFileSync(
    __dirname + "/migrations/student_tables.sql",
    "utf8"
  );
  await pool.query(sql);
}
runMigrations().catch((e) => {
  console.error("migration failed", e);
});

app.post("/daily-checkin", async (req, res) => {
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
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "server error" });
  } finally {
    client.release();
  }
});

app.post("/assign-intervention", async (req, res) => {
  const student_id = req.body?.student_id || req.query.student_id;
  const task = req.body?.task || req.query.task;
  const assigned_by = req.body?.assigned_by || req.query.assigned_by;

  if (!student_id || !task)
    return res.status(400).json({ error: "missing fields" });
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

    return res.json({ ok: true, interventionId });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "server error" });
  } finally {
    client.release();
  }
});

app.post("/complete-intervention", async (req, res) => {
  const { student_id, intervention_id } = req.body;
  if (!student_id || !intervention_id)
    return res.status(400).json({ error: "missing" });
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
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "server error" });
  } finally {
    client.release();
  }
});

app.get("/student/:id/status", async (req, res) => {
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

io.on("connection", (socket) => {
  console.log("Student connected:", socket.id);

  const { student_id } = socket.handshake.query || {};
  if (student_id) socket.join(student_id);
  socket.on("join", (sid) => socket.join(sid));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("Server + WebSockets running on", PORT));
