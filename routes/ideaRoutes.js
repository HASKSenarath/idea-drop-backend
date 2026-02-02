import express from "express";
import Idea from "../models/Idea.js";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes

// @route       GET /api/ideas
// Description  Get all ideas
// Access       Public
// @query       _limit (optional)  Number of ideas to return

router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query._limit);
    const query = Idea.find().sort({ createdAt: -1 });
    if (!isNaN(limit) && limit > 0) {
      query.limit(limit);
    }
    const ideas = await query.exec();
    res.json(ideas);
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// @route       GET /api/ideas/:id
// Description  Get an idea by ID
// Access       Public
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid idea ID" });
    }
    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }
    res.json(idea);
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// @route       POST /api/ideas
// Description  Create a new idea
// Access       Public
router.post("/", protect, express.json(), async (req, res, next) => {
  try {
    const { title, summary, description, tags } = req.body || {};
    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error("Title, summary, and description are required");
    }

    const newIdea = new Idea({
      title,
      summary,
      description,
      tags:
        typeof tags === "string"
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : Array.isArray(tags)
            ? tags.map((tag) => tag.trim()).filter(Boolean)
            : [],
      user: req.user._id,
    });

    const savedIdea = await newIdea.save();
    res
      .status(201)
      .json({ message: "Idea created successfully", idea: savedIdea });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// @route       DELETE /api/ideas/:id
// Description  Delete an idea by ID
// Access       Public
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Invalid idea ID" });
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Check if the user is the owner of the idea
    if (idea.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this idea" });
    }

    await idea.deleteOne();

    res.json({ message: "Idea deleted successfully" });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// @route       PUT /api/ideas/:id
// Description  Update an idea by ID
// Access       Public

router.put("/:id", protect, express.json(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, summary, description, tags } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Invalid idea ID" });
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Check if the user is the owner of the idea
    if (idea.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this idea" });
    }

    idea.title = title;
    idea.summary = summary;
    idea.description = description;
    idea.tags =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : Array.isArray(tags)
          ? tags.map((tag) => tag.trim()).filter(Boolean)
          : [];

    const updatedIdea = await idea.save();

    if (!updatedIdea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    res.json({ message: "Idea updated successfully", idea: updatedIdea });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

export default router;
