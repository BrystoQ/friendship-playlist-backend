// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { syncUserPlaylistsByToken } from "./spotify.controller.ts";
import { encrypt } from "../utils/crypto.ts";

/**
 * Génère une chaîne de caractères aléatoire pour sécuriser le processus OAuth.
 * @param length - Nombre de caractères à générer
 * @returns Une chaîne aléatoire
 */
function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Redirige l'utilisateur vers l'URL d'authentification de Spotify.
 */
export function login(req: Request, res: Response) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;
  const scope =
    "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private";
  const state = generateRandomString(16);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

/**
 * Gère le callback de Spotify après l'authentification.
 * Échange le code d'autorisation contre des tokens,
 * récupère le profil utilisateur pour obtenir l'ownerId,
 * chiffre et stocke les tokens dans la DB, synchronise les playlists,
 * puis redirige vers le frontend.
 */
export async function callback(req: Request, res: Response) {
  try {
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code d'autorisation manquant" });
    }

    // Échange du code contre les tokens
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(
        `Erreur HTTP lors de l'obtention des tokens: ${tokenResponse.status}`
      );
    }

    const { access_token, refresh_token, expires_in } =
      await tokenResponse.json();

    // Récupérer le profil utilisateur
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileResponse.ok) {
      throw new Error(
        `Erreur HTTP lors de la récupération du profil: ${profileResponse.status}`
      );
    }
    const profile = await profileResponse.json();
    const userId = profile.id;

    // Calculer la date d'expiration
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // Chiffrer les tokens avant de les stocker
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = encrypt(refresh_token);

    // Stocker ou mettre à jour l'utilisateur dans la DB
    const db = req.app.locals.db;
    const existingUser = await db
      .collection("users")
      .findOne({ spotifyId: userId });
    if (existingUser) {
      await db.collection("users").updateOne(
        { _id: existingUser._id },
        {
          $set: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt,
          },
        }
      );
    } else {
      await db.collection("users").insertOne({
        spotifyId: userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
      });
    }

    // Synchroniser les playlists (optionnel)
    try {
      await syncUserPlaylistsByToken(access_token, db, userId);
    } catch (syncError) {
      console.error(
        "Erreur lors de la synchronisation automatique des playlists:",
        syncError
      );
    }

    // Rediriger vers le frontend avec l'ownerId (pour éviter de transmettre les tokens en clair)
    return res.redirect(`http://localhost:3000?ownerId=${userId}`);
  } catch (error) {
    console.error("Erreur d’authentification :", error);
    return res.status(500).json({ error: "Erreur d’authentification" });
  }
}
