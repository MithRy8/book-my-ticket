import pg from "pg";
import "dotenv/config";

console.log("My Database URL is: ", process.env.DB_PASSWORD);

// The Smart Pool
const pool = new pg.Pool(
  process.env.DB_PASSWORD
    ? {
        connectionString: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: process.env.LOCAL_DB_PASSWORD,
        database: "sql_class_2_db",
        max: 20,
      },
);

export default pool;
