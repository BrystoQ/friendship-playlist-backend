import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI || "";
const client = new MongoClient(uri);

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
