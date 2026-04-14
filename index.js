import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import "dotenv/config";

import pool from "./src/config/db.js";

import authRoutes from "./src/features/auth/auth.routes.js";
import { authenticateToken } from "./src/middlewares/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;

const app = new express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/seats", async (req, res) => {
  const result = await pool.query(`
    SELECT seats.id, seats.isbooked, COALESCE(users.username, seats.name) as name 
    FROM seats 
    LEFT JOIN users ON seats.user_id = users.id
  `);
  res.send(result.rows);
});

app.put("/:id/:name", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.user.username;
    const userId = req.user.id;

    const conn = await pool.connect();
    await conn.query("BEGIN");

    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(400).send({ error: "Seat already booked" });
    }

    const sqlU =
      "update seats set isbooked = 1, name = $2, user_id = $3 where id = $1";
    await conn.query(sqlU, [id, name, userId]);

    await conn.query("COMMIT");
    conn.release();
    res.send({ success: true, message: "Seat booked successfully!" });
  } catch (ex) {
    console.log(ex);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
