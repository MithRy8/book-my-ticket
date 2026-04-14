import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { createUser, getUserByEmail } from "./auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (email, username, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await createUser(email, username, hashedPassword);
};

export const loginUser = async (email, password) => {

  const user = await getUserByEmail(email);
  if (!user) throw new Error("User not found");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error("Invalid password");


  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, username: user.username };
};