// src/utils/crypto.ts
import crypto from "crypto";

// On peut définir l'algorithme et utiliser une clé dérivée d'une variable d'environnement
const algorithm = "aes-256-cbc";
const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD || "default_secret"; // Doit être défini dans le .env en production
const key = crypto.scryptSync(ENCRYPTION_PASSWORD, "salt", 32); // La clé est dérivée du mot de passe
const ivLength = 16; // Longueur IV pour AES

/**
 * Chiffre un texte donné.
 * @param text - Le texte à chiffrer
 * @returns Un objet contenant l'IV et le contenu chiffré en hexadécimal.
 */
export function encrypt(text: string): { iv: string; content: string } {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return { iv: iv.toString("hex"), content: encrypted.toString("hex") };
}

/**
 * Déchiffre un texte chiffré.
 * @param hash - L'objet contenant l'IV et le contenu chiffré.
 * @returns Le texte déchiffré.
 */
export function decrypt(hash: { iv: string; content: string }): string {
  const iv = Buffer.from(hash.iv, "hex");
  const encryptedText = Buffer.from(hash.content, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
