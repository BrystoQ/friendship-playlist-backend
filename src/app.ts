import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes de base
app.get("/", (req, res) => {
  res.send("Bienvenue sur FriendShip Playlist API 🎵");
});

// Connexion à MongoDB
connectDB();

export default app;
