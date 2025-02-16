// src/routes/auth.ts
import express from "express";
import { login, callback } from "../controllers/auth.controller.ts";

const router = express.Router();

// Route /auth/login pour initier l'authentification avec Spotify
router.get("/login", (req, res) => {
  login(req, res);
});

// Route /auth/callback pour gérer le callback de Spotify
router.get("/callback", (req, res) => {
  // Utilisation d'une fonction asynchrone directement dans le contrôleur
  callback(req, res);
});

export default router;
