// src/server.ts
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;

try {
  const db = await connectDB();
  // Vérifie que db est bien défini
  app.locals.db = db;
} catch (err) {
  console.error("Échec de la connexion à la base de données :", err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
