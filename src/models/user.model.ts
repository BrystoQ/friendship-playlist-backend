// src/models/user.model.ts
export interface SpotifyUser {
  _id?: any;
  spotifyId: string; // Spotify User ID
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date; // Optionnel : pour suivre la date d'expiration
  // d'autres informations du profil utilisateur peuvent être ajoutées ici
}
