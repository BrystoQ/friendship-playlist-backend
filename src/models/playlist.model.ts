// src/models/playlist.model.ts

/**
 * Interface représentant une Playlist.
 */
export interface Playlist {
  _id?: any; // L'ObjectId généré par MongoDB
  ownerId: string; // L'identifiant de l'utilisateur (Spotify User ID)
  spotifyId?: string; // L'identifiant de la playlist sur Spotify (optionnel si non synchronisée)
  name: string; // Le nom de la playlist
  locked: boolean; // Indique si la playlist est verrouillée pour modification via l'application
  description: string; // La description de la playlist
  imageUrl: string; // URL de la première image de la playlist
  externalUrl: string; // Lien direct vers la playlist sur Spotify
  trackCount: number; // Le nombre de morceaux dans la playlist
}
