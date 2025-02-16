// src/schemas/playlist.schema.ts
export const createPlaylistSchema = {
  type: "object",
  properties: {
    ownerId: { type: "string" },
    name: { type: "string", minLength: 1 },
  },
  required: ["ownerId", "name"],
  additionalProperties: false,
};
