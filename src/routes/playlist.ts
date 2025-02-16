// src/routes/playlist.ts
import express from "express";
import { createPlaylist } from "../controllers/playlist.controller.js";
import { createPlaylistSchema } from "../schemas/playlist.schema.js";
import { validateSchema } from "../middlewares/validate.js";

const router = express.Router();

/**
 * Endpoint POST /playlists
 * Permet de créer une nouvelle playlist.
 */
router.post("/", validateSchema(createPlaylistSchema), (req, res) => {
  createPlaylist(req, res);
});

export default router;
