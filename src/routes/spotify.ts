// src/routes/spotify.ts
import express from "express";
import {
  getUserPlaylists,
  syncUserPlaylistsByToken,
} from "../controllers/spotify.controller.ts";
import { refreshTokenMiddleware } from "../middlewares/refreshToken.ts";

const router = express.Router();

/**
 * GET /spotify/playlists
 * Récupère les playlists créées par l'utilisateur depuis Spotify (filtrées).
 * Le middleware refreshTokenMiddleware assure que le token est valide.
 * L'ownerId est fourni en query string.
 */
router.get("/playlists", refreshTokenMiddleware, async (req, res) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      res.status(400).json({ error: "ownerId is required" });
      return;
    }
    const db = req.app.locals.db;
    const user = await db.collection("users").findOne({ spotifyId: ownerId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Met à jour directement le header Authorization de la requête
    req.headers.authorization = `Bearer ${user.accessToken}`;
    await getUserPlaylists(req, res);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
});

/**
 * GET /spotify/sync-playlists
 * Synchronise les playlists de l'utilisateur dans la base de données.
 * L'ownerId est fourni en query string et le token est récupéré de la DB.
 */
router.get("/sync-playlists", refreshTokenMiddleware, async (req, res) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      res.status(400).json({ error: "ownerId is required" });
      return;
    }
    const db = req.app.locals.db;
    const user = await db.collection("users").findOne({ spotifyId: ownerId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Récupère l'access token stocké pour cet utilisateur
    req.headers.authorization = `Bearer ${user.accessToken}`;
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text();
      res
        .status(profileResponse.status)
        .json({ error: "Failed to fetch user profile", details: errorBody });
      return;
    }
    const profile = await profileResponse.json();
    const userId = profile.id;
    const syncResult = await syncUserPlaylistsByToken(
      user.accessToken,
      db,
      userId
    );
    res.status(200).json(syncResult);
    return;
  } catch (error) {
    console.error("Error synchronizing Spotify playlists:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
});

export default router;
