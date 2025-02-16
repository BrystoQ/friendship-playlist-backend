// src/middlewares/refreshToken.ts
import { Request, Response, NextFunction } from "express";
import { refreshSpotifyToken } from "../utils/spotifyRefresh.ts";
import { decrypt, encrypt } from "../utils/crypto.ts";

export async function refreshTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    // On suppose que tokenExpiresAt est stocké en DB et convertible en Date.
    const tokenExpiresAt = new Date(user.tokenExpiresAt);
    const now = new Date();
    if (tokenExpiresAt <= now) {
      // Le token est expiré, on le rafraîchit
      const decryptedRefreshToken = decrypt(user.refreshToken); // Déchiffre le refresh token stocké
      const tokens = await refreshSpotifyToken(decryptedRefreshToken);
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      const encryptedAccessToken = encrypt(tokens.access_token);
      let encryptedRefreshToken = user.refreshToken; // Conserve l'ancien refresh token par défaut
      if (tokens.refresh_token) {
        encryptedRefreshToken = encrypt(tokens.refresh_token);
      }
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt: newExpiresAt,
          },
        }
      );
      // Met à jour le header Authorization pour les requêtes suivantes
      req.headers.authorization = `Bearer ${tokens.access_token}`;
    }
    next();
  } catch (error) {
    console.error("Error in refreshTokenMiddleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
}
