import express from "express";
import path from "path"; // Fixed: Importing the whole path module
import { fileURLToPath } from "url";
import cors from "cors";
import "dotenv/config";

import pool from "./src/config/db.js";

import authRoutes from "./src/features/auth/auth.routes.js";
import { authenticateToken } from "./src/middlewares/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;

const app = express(); // Fixed: Removed 'new'
app.use(cors());
app.use(express.json());

// Serving static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRoutes);

// Updated to use path.join for reliability
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/seats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT seats.id, seats.isbooked, COALESCE(users.username, seats.name) as name 
      FROM seats 
      LEFT JOIN users ON seats.user_id = users.id
    `);
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Database error" });
  }
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

    const sqlU = "update seats set isbooked = 1, name = $2, user_id = $3 where id = $1";
    await conn.query(sqlU, [id, name, userId]);

    await conn.query("COMMIT");
    conn.release();
    res.send({ success: true, message: "Seat booked successfully!" });
  } catch (ex) {
    console.error(ex);
    res.status(500).send({ error: "Internal server error" });
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => console.log("Server starting on port: " + port));
}

// CRITICAL FOR VERCEL
export default app;