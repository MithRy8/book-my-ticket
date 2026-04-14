import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ error: "Email, username, and password are required" });
    }

    const user = await authService.registerUser(email, username, password);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (ex) {
    if (ex.code === "23505") {
      return res
        .status(400)
        .json({ error: "Email or Username already exists" });
    }
    console.error(ex);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.loginUser(email, password);
    res.json({ message: "Login successful", ...result });
  } catch (ex) {
    if (ex.message === "User not found" || ex.message === "Invalid password") {
      return res.status(400).json({ error: ex.message });
    }
    console.error(ex);
    res.status(500).json({ error: "Internal server error" });
  }
};
