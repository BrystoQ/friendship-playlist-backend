// src/routes/questionnaire.ts
import express from "express";
import {
  createQuestionnaire,
  getQuestionnaire,
  addResponse,
} from "../controllers/questionnaire.controller.ts";

const router = express.Router();

// Créer un questionnaire : POST /questionnaires
router.post("/", (req, res) => {
  createQuestionnaire(req, res);
});

// Récupérer un questionnaire : GET /questionnaires/:id
router.get("/:id", (req, res) => {
  getQuestionnaire(req, res);
});

// Ajouter une réponse : POST /questionnaires/:id/responses
router.post("/:id/responses", (req, res) => {
  addResponse(req, res);
});

export default router;
