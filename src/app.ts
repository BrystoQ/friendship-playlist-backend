// src/app.ts
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

// Initialisation de l'application Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes de base
app.get("/", (req, res) => {
  res.send("Bienvenue sur FriendShip Playlist API 🎵");
});

// Routes d'authentification
app.use("/auth", authRoutes);

export default app;
