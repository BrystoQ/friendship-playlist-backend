// src/middlewares/validate.ts
import Ajv from "ajv";
import { Request, Response, NextFunction } from "express";

const ajv = new (Ajv as any)();

/**
 * Middleware générique pour valider le body d'une requête en fonction d'un schéma JSON.
 * @param schema - Le schéma JSON de validation.
 * @returns Middleware Express qui valide req.body et renvoie une erreur 400 si la validation échoue.
 */
export function validateSchema(schema: any) {
  const validate = ajv.compile(schema);
  return (req: Request, res: Response, next: NextFunction): void => {
    const valid = validate(req.body);
    if (!valid) {
      res.status(400).json({ errors: validate.errors });
      return; // Assure que la fonction retourne void
    }
    next();
  };
}
