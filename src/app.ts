// src/app.ts
import express from "express";
import cors from "cors";
import loadRoutes from "./routes/index.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route racine pour tester le serveur
app.get("/", (req, res) => {
  res.send("Bienvenue sur FriendShip Playlist API 🎵");
});

// Charger toutes les routes via l'index
loadRoutes(app);

export default app;
