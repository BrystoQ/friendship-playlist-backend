// src/controllers/questionnaire.controller.ts
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { Questionnaire } from "../models/questionnaire.model.ts";

/**
 * Crée un nouveau questionnaire lié à une playlist.
 * Exige dans le body :
 * - playlistId : identifiant de la playlist associée
 * - questions : tableau des questions (non vide)
 */
export async function createQuestionnaire(req: Request, res: Response) {
  try {
    const { playlistId, questions } = req.body;
    if (
      !playlistId ||
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "playlistId et questions (non vide) sont requis." });
    }
    const db = req.app.locals.db;
    const newQuestionnaire: Questionnaire = {
      playlistId,
      questions,
      responses: [],
      createdAt: new Date(),
    };
    const result = await db
      .collection("questionnaires")
      .insertOne(newQuestionnaire);
    return res.status(201).json({
      message: "Questionnaire créé",
      questionnaireId: result.insertedId,
    });
  } catch (error) {
    console.error("Erreur lors de la création du questionnaire:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

/**
 * Récupère un questionnaire par son identifiant.
 * L'ID doit être passé en paramètre d'URL.
 */
export async function getQuestionnaire(req: Request, res: Response) {
  try {
    const questionnaireId = req.params.id;
    if (!ObjectId.isValid(questionnaireId)) {
      return res
        .status(400)
        .json({ error: "Identifiant de questionnaire invalide." });
    }
    const db = req.app.locals.db;
    const questionnaire = await db
      .collection("questionnaires")
      .findOne({ _id: new ObjectId(questionnaireId) });
    if (!questionnaire) {
      return res.status(404).json({ error: "Questionnaire non trouvé." });
    }
    return res.status(200).json(questionnaire);
  } catch (error) {
    console.error("Erreur lors de la récupération du questionnaire:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

/**
 * Ajoute une réponse à un questionnaire.
 * L'ID du questionnaire est passé en paramètre d'URL.
 * Le body doit contenir :
 * - respondentId : identifiant du répondant
 * - answers : tableau des réponses (ordre correspondant aux questions)
 */
export async function addResponse(req: Request, res: Response) {
  try {
    const questionnaireId = req.params.id;
    const { respondentId, answers } = req.body;
    if (!respondentId || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ error: "respondentId et answers (tableau) sont requis." });
    }
    if (!ObjectId.isValid(questionnaireId)) {
      return res
        .status(400)
        .json({ error: "Identifiant de questionnaire invalide." });
    }
    const db = req.app.locals.db;
    const updateResult = await db.collection("questionnaires").updateOne(
      { _id: new ObjectId(questionnaireId) },
      {
        $push: {
          responses: {
            respondentId,
            answers,
            respondedAt: new Date(),
          },
        },
      }
    );
    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Questionnaire non trouvé ou mise à jour échouée." });
    }
    return res.status(200).json({ message: "Réponse ajoutée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la soumission de la réponse:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
