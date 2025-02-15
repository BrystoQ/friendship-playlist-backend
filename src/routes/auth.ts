import express, { Request, Response } from "express";
import "dotenv/config"; // Charge automatiquement les variables d'environnement depuis .env

const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

/**
 * Génère une chaîne de caractères aléatoire de la longueur donnée.
 * Cette chaîne servira d'état pour sécuriser le processus OAuth.
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
 * Route /login
 * Redirige l'utilisateur vers l'URL d'authentification de Spotify avec les paramètres nécessaires.
 */
router.get("/login", (req: Request, res: Response) => {
  const state = generateRandomString(16);
  const scope =
    "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private";

  // Utilisation de URLSearchParams pour construire la query string de façon moderne et sécurisée
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

/**
 * Route /callback
 * Gère la redirection de Spotify après l'authentification.
 * Utilise une IIFE asynchrone pour contourner les problèmes de typage avec les fonctions async dans les routes Express.
 */
router.get("/callback", (req: Request, res: Response) => {
  (async () => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Code d'autorisation manquant" });
      }

      // Envoi d'une requête POST à l'API Spotify pour échanger le code contre des tokens
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Création d'un header d'autorisation encodé en base64 (client_id:client_secret)
          Authorization: `Basic ${Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const { access_token, refresh_token } = await response.json();

      // Redirige l'utilisateur vers le frontend en passant les tokens dans l'URL
      return res.redirect(
        `http://localhost:3000?access_token=${access_token}&refresh_token=${refresh_token}`
      );
    } catch (error) {
      console.error("Erreur d’authentification :", error);
      return res.status(500).json({ error: "Erreur d’authentification" });
    }
  })();
});

export default router;
