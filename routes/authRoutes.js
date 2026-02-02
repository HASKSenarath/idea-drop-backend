import mongoose from "mongoose";
import express from "express";
import User from "../models/User.js";
import { jwtVerify } from "jose";
import JWT_SECRET from "../utils/getJwtSecret.js";
import { generateToken } from "../utils/generateToken.js";

const router = express.Router();

// Routes

// @route           POST /api/auth/register
// @description     Register a new user
// @access          Public
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
      password,
    });

    const savedUser = await User.create(newUser);

    // Create tokens
    const payload = { id: savedUser._id.toString() };
    const accessToken = await generateToken(payload, "1m");
    const refreshToken = await generateToken(payload, "30d");

    // set refresh token in httpOnly cookie

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      accessToken,
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// @route           POST /api/auth/logout
// @description     Logout user and clear refresh token cookie
// @access          private
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

// @route           POST /api/auth/login
// @description     Login user
// @access          Public
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    // find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create tokens
    const payload = { id: user._id.toString() };
    const accessToken = await generateToken(payload, "1m");
    const refreshToken = await generateToken(payload, "30d");

    // set refresh token in httpOnly cookie

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      accessToken,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// @route           POST /api/auth/refresh
// @description     Generate new access token using refresh token
// @access          public (Needs valid refresh token cookie)

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401);
      throw new Error("No refresh token provided");
    }

    const { payload } = await jwtVerify(refreshToken, JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    // Generate new access token
    const accessToken = await generateToken({ id: user._id.toString() }, "1m");

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      message: "New access token generated",
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
    console.error(err.message);
    next(err);
  }
});

export default router;
