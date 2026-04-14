import pool from "../../config/db.js";

export const createUser = async (email, username, hashedPassword) => {
  const result = await pool.query(
    "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
    [email, username, hashedPassword]
  );
  return result.rows[0];
};


export const getUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0]; 
};