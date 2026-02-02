import { jwtVerify } from "jose";
import dotenv from "dotenv";
import User from "../models/User.js";
import JWT_SECRET from "../utils/getJwtSecret.js";

dotenv.config();

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("_id name email");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
