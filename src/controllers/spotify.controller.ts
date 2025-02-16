// src/controllers/spotify.controller.ts
import { Request, Response } from "express";

/**
 * Synchronise les playlists Spotify de l'utilisateur dans la base de données.
 * Pour chaque playlist (dont l'utilisateur est le créateur), si elle n'existe pas en DB,
 * elle est insérée avec locked: true, et si elle existe et que certains champs ont changé
 * (notamment name, description, imageUrl, externalUrl, trackCount), la playlist est mise à jour.
 *
 * @param accessToken - L'access token Spotify
 * @param db - L'instance de la base de données (MongoDB)
 * @param userId - L'identifiant de l'utilisateur (Spotify)
 * @returns Un objet contenant la liste des playlists insérées et mises à jour, ainsi que le total récupéré depuis Spotify.
 */
export async function syncUserPlaylistsByToken(
  accessToken: string,
  db: any,
  userId: string
) {
  // Récupérer les playlists depuis l'API Spotify
  const playlistsResponse = await fetch(
    "https://api.spotify.com/v1/me/playlists",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!playlistsResponse.ok) {
    throw new Error(`Failed to fetch playlists: ${playlistsResponse.status}`);
  }
  const playlistsData = await playlistsResponse.json();
  // Filtrer pour ne garder que les playlists dont l'utilisateur est le créateur
  const userPlaylists = playlistsData.items.filter((playlist: any) => {
    return playlist.owner && playlist.owner.id === userId;
  });

  const insertedPlaylists: any[] = [];
  const updatedPlaylists: any[] = [];

  for (const playlist of userPlaylists) {
    // Données récupérées depuis Spotify
    const newData = {
      name: playlist.name,
      description: playlist.description || "",
      imageUrl:
        playlist.images && playlist.images.length > 0
          ? playlist.images[0].url
          : "",
      externalUrl: playlist.external_urls ? playlist.external_urls.spotify : "",
      trackCount: playlist.tracks ? playlist.tracks.total : 0,
      locked: true,
    };

    // Vérifier si la playlist existe déjà dans la DB pour cet utilisateur
    const existing = await db.collection("playlists").findOne({
      ownerId: userId,
      spotifyId: playlist.id,
    });

    if (!existing) {
      // La playlist n'existe pas : insertion dans la DB
      const newPlaylist = {
        ownerId: userId,
        spotifyId: playlist.id,
        ...newData,
      };
      const result = await db.collection("playlists").insertOne(newPlaylist);
      insertedPlaylists.push({ ...newPlaylist, _id: result.insertedId });
    } else {
      // La playlist existe : vérifier si des champs ont été modifiés sur Spotify
      let updateNeeded = false;
      const updateFields: any = {};
      if (existing.name !== newData.name) {
        updateNeeded = true;
        updateFields.name = newData.name;
      }
      if (existing.description !== newData.description) {
        updateNeeded = true;
        updateFields.description = newData.description;
      }
      if (existing.imageUrl !== newData.imageUrl) {
        updateNeeded = true;
        updateFields.imageUrl = newData.imageUrl;
      }
      if (existing.externalUrl !== newData.externalUrl) {
        updateNeeded = true;
        updateFields.externalUrl = newData.externalUrl;
      }
      if (existing.trackCount !== newData.trackCount) {
        updateNeeded = true;
        updateFields.trackCount = newData.trackCount;
      }
      if (updateNeeded) {
        await db
          .collection("playlists")
          .updateOne({ _id: existing._id }, { $set: updateFields });
        updatedPlaylists.push({ ...existing, ...updateFields });
      }
    }
  }

  return {
    insertedPlaylists,
    updatedPlaylists,
    totalSpotifyPlaylists: userPlaylists.length,
  };
}

/**
 * Récupère les playlists créées par l'utilisateur depuis l'API Spotify.
 * L'access token doit être fourni soit dans le header Authorization, soit en query parameter.
 */
export async function getUserPlaylists(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader
      ? authHeader.split(" ")[1]
      : req.query.access_token;
    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ error: "Access token is required" });
    }
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) {
      const errorBody = await profileResponse.text();
      return res
        .status(profileResponse.status)
        .json({ error: "Failed to fetch user profile", details: errorBody });
    }
    const profile = await profileResponse.json();
    const userId = profile.id;
    const spotifyResponse = await fetch(
      "https://api.spotify.com/v1/me/playlists",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!spotifyResponse.ok) {
      const errorBody = await spotifyResponse.text();
      return res.status(spotifyResponse.status).json({
        error: "Failed to fetch playlists from Spotify",
        details: errorBody,
      });
    }
    const playlistsData = await spotifyResponse.json();
    const filteredPlaylists = playlistsData.items.filter((playlist: any) => {
      return playlist.owner && playlist.owner.id === userId;
    });
    return res.status(200).json({ ...playlistsData, items: filteredPlaylists });
  } catch (error) {
    console.error("Error fetching Spotify playlists:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
