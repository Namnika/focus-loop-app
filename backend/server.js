const pool = require("./db");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./sockets");
const cors = require("cors");
const dailyRoutes = require("./routes/daily");
const interventionRoutes = require("./routes/intervention");
const studentRoutes = require("./routes/student");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use((req, res, next) => {
  req.io = io;
  next();
})

app.use("/daily", dailyRoutes);
app.use("/intervention", interventionRoutes);
app.use("/student", studentRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});
socketHandler(io)

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

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => console.log("Server + WebSockets running on", PORT));
