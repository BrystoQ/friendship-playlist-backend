// src/controllers/playlist.controller.ts
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { Playlist } from "../models/playlist.model.ts";

/**
 * Crée une nouvelle playlist pour un utilisateur.
 * Exige dans le body :
 * - ownerId : identifiant de l'utilisateur propriétaire (Spotify User ID).
 * - name : nom de la playlist.
 * - accessToken : access token Spotify pour pouvoir créer la playlist sur Spotify.
 * Vérifie qu'une playlist avec le même nom n'existe pas déjà pour cet utilisateur dans la DB locale.
 * Crée ensuite la playlist sur Spotify en public par défaut et enregistre son spotifyId et d'autres informations.
 */
export async function createPlaylist(req: Request, res: Response) {
  try {
    const { ownerId, name, accessToken } = req.body;
    if (!ownerId || !name || !accessToken) {
      return res
        .status(400)
        .json({ error: "ownerId, name et accessToken sont requis." });
    }

    const db = req.app.locals.db;
    // Vérifie qu'il n'existe pas déjà une playlist avec le même nom pour cet ownerId dans la DB locale
    const existingPlaylist = await db
      .collection("playlists")
      .findOne({ ownerId, name });
    if (existingPlaylist) {
      return res
        .status(400)
        .json({ error: "Vous possédez déjà une playlist avec ce nom." });
    }

    // Appel à l'API Spotify pour créer la playlist
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/users/${ownerId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          public: true, // Création en public par défaut
        }),
      }
    );

    if (!spotifyResponse.ok) {
      const errorBody = await spotifyResponse.text();
      return res.status(spotifyResponse.status).json({
        error: "Erreur lors de la création de la playlist sur Spotify",
        details: errorBody,
      });
    }

    const spotifyData = await spotifyResponse.json();
    const spotifyId = spotifyData.id;

    // Créer la nouvelle playlist dans la base de données locale avec les informations récupérées depuis Spotify
    const newPlaylist: Playlist = {
      ownerId,
      spotifyId, // ID renvoyé par Spotify
      name,
      locked: true,
      description: spotifyData.description || "",
      imageUrl:
        spotifyData.images && spotifyData.images.length > 0
          ? spotifyData.images[0].url
          : "",
      externalUrl: spotifyData.external_urls
        ? spotifyData.external_urls.spotify
        : "",
      trackCount: spotifyData.tracks ? spotifyData.tracks.total : 0,
    };

    const result = await db.collection("playlists").insertOne(newPlaylist);
    return res.status(201).json({
      message: "Playlist créée",
      playlistId: result.insertedId,
      spotifyPlaylist: spotifyData,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la playlist:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
