/**
 * Stadium knowledge base access. Validates the KB fixture, renders it as
 * model context for the assistant, and provides the keyword lookup that
 * powers the deterministic mock assistant.
 */
import { z } from "zod";

import stadiumKbRaw from "@/data/stadium-kb.json";

const kbSchema = z.object({
  venue: z.string().min(1),
  entries: z
    .array(
      z.object({
        id: z.string().min(1),
        topic: z.string().min(1),
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

/** One knowledge-base FAQ entry. */
export type KbEntry = z.infer<typeof kbSchema>["entries"][number];

const kb = kbSchema.parse(stadiumKbRaw);

/** Returns every KB entry (fixture order). */
export function listKbEntries(): KbEntry[] {
  return kb.entries;
}

/** Renders the full KB as plain text context for the assistant system prompt. */
export function kbAsContext(): string {
  return kb.entries.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`).join("\n\n");
}

/**
 * Finds the KB entries that best match a free-text query via case-insensitive
 * keyword overlap. Used by the mock assistant to give relevant canned answers.
 */
export function findKbMatches(query: string, limit = 2): KbEntry[] {
  const words = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2);
  if (words.length === 0) {
    return [];
  }
  const scored = kb.entries
    .map((entry) => {
      const haystack = `${entry.topic} ${entry.question} ${entry.answer}`.toLowerCase();
      const score = words.reduce((sum, word) => (haystack.includes(word) ? sum + 1 : sum), 0);
      return { entry, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((candidate) => candidate.entry);
}
