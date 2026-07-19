/**
 * Schemas for the Multilingual Match-Day Assistant (F1). Requests are strict:
 * unknown fields are rejected and every free-text field is length-bounded.
 */
import { z } from "zod";

import { languageSchema } from "./common";

import { MAX_CHAT_HISTORY_TURNS, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";

export const chatTurnSchema = z.strictObject({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
});
export type ChatTurn = z.infer<typeof chatTurnSchema>;

export const chatRequestSchema = z.strictObject({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
  history: z.array(chatTurnSchema).max(MAX_CHAT_HISTORY_TURNS).default([]),
  language: languageSchema.optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;
