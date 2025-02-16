// src/routes/index.ts
import authRoutes from "./auth.ts";
import questionnaireRoutes from "./questionnaire.ts";
import playlistRoutes from "./playlist.ts";
import spotifyRoutes from "./spotify.ts";

/**
 * Charge toutes les routes de l'application sur l'instance Express passée en paramètre.
 * @param app - L'instance Express
 */
export default function loadRoutes(app: any) {
  app.use("/auth", authRoutes);
  app.use("/questionnaires", questionnaireRoutes);
  app.use("/playlists", playlistRoutes);
  app.use("/spotify", spotifyRoutes);
}
