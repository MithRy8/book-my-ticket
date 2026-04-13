import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: process.env.DB_PASSWORD,
  database: "sql_class_2_db",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = new express();
app.use(cors());
app.use(express.json());

// register
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword],
    );
    res
      .status(201)
      .json({ message: "user registred successfully", user: result.rows[0] });
  } catch (ex) {
    if (ex.code === "23505") {
      return res.status(400).json({ error: "username already exists" });
      console.error(ex);
      res.status(500).json({ error: "internal server error" });
    }
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    // 1. Check if user exists. If not, return error and STOP.
    if (result.rowCount === 0) {
      return res.status(400).json({ error: "user not found" });
    } // <--- Notice the closing bracket is here now!

    // 2. If we make it here, the user exists! Let's check the password.
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Password is correct, generate the token.
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ message: "Login successful", token, username: user.username });
  } catch (ex) {
    console.error(ex);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware for auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "access denied. please login first." });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }

    req.user = user;
    next();
  });
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/seats", async (req, res) => {
  const result = await pool.query("select * from seats"); // equivalent to Seats.find() in mongoose
  res.send(result.rows);
});

//book a seat give the seatId and your name

// app.put("/:id/:name", async (req, res) => {
//   try {
//     const id = req.params.id;
//     const name = req.params.name;
//     // payment integration should be here
//     // verify payment
//     const conn = await pool.connect(); // pick a connection from the pool
//     //begin transaction
//     // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
//     await conn.query("BEGIN");
//     //getting the row to make sure it is not booked
//     /// $1 is a variable which we are passing in the array as the second parameter of query function,
//     // Why do we use $1? -> this is to avoid SQL INJECTION
//     // (If you do ${id} directly in the query string,
//     // then it can be manipulated by the user to execute malicious SQL code)
//     const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
//     const result = await conn.query(sql, [id]);

//     //if no rows found then the operation should fail can't book
//     // This shows we Do not have the current seat available for booking
//     if (result.rowCount === 0) {
//       res.send({ error: "Seat already booked" });
//       return;
//     }
//     //if we get the row, we are safe to update
//     const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
//     const updateResult = await conn.query(sqlU, [id, name]); // Again to avoid SQL INJECTION we are using $1 and $2 as placeholders

//     //end transaction by committing
//     await conn.query("COMMIT");
//     conn.release(); // release the connection back to the pool (so we do not keep the connection open unnecessarily)
//     res.send(updateResult);
//   } catch (ex) {
//     console.log(ex);
//     res.send(500);
//   }
// });
// Notice we added 'authenticateToken' right after the URL path!
app.put("/:id/:name", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
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
    const updateResult = await conn.query(sqlU, [id, name, userId]);

    await conn.query("COMMIT");
    conn.release();
    res.send({ success: true, message: "Seat booked successfully!" });
  } catch (ex) {
    console.log(ex);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
