// src/models/questionnaire.model.ts

/**
 * Interface représentant une réponse à un questionnaire.
 */
export interface QuestionnaireResponse {
  respondentId: string;
  answers: string[];
  respondedAt: Date;
}

/**
 * Interface représentant un questionnaire.
 */
export interface Questionnaire {
  _id?: any; // Utilisation d'any pour ObjectId (ou utilisez un type spécifique si souhaité)
  playlistId: string;
  questions: string[];
  responses: QuestionnaireResponse[];
  createdAt: Date;
}
