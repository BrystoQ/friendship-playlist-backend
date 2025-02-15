// src/server.ts
import "dotenv/config"; // Charge automatiquement les variables d'environnement depuis .env
import { fileURLToPath } from "url";
import path from "path";
import app from "./app.js"; // Importation de l'instance configurée dans app.ts
import { connectDB } from "./config/db.js"; // Note : extension .js pour ESM

// Définir __filename et __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;

try {
  // Attente de la connexion à MongoDB
  await connectDB();
} catch (err) {
  console.error("Échec de la connexion à la base de données :", err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
