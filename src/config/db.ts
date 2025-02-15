// src/config/db.ts
import { MongoClient } from "mongodb";
import "dotenv/config"; // Charge automatiquement les variables d'environnement

const uri = process.env.MONGO_URI || "";
const client = new MongoClient(uri);

/**
 * Connexion à la base de données MongoDB.
 * En cas de succès, renvoie la base de données "friendship_playlist".
 */
export async function connectDB() {
  try {
    await client.connect();
    console.log("🟢 Connecté à MongoDB");
    return client.db("friendship_playlist");
  } catch (error) {
    console.error("🔴 Erreur de connexion MongoDB", error);
    process.exit(1);
  }
}
