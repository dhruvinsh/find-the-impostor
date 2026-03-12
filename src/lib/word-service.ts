import { Locale } from "../config/language";
import { db } from "./storage";
import { FALLBACK_WORDS_WITH_HINTS } from "@/src/data/fallbackwords";
import { Difficulty, WordWithHints } from "@/src/types/game";

export async function getRandomWordWithHints(
  category: string,
  language: Locale,
  difficulty: Difficulty = "medium",
): Promise<{ wordWithHints: WordWithHints; usedFallback: boolean }> {
  try {
    const cached = await db.wordSets
      .where(["category", "language"])
      .equals([category.toLowerCase(), language])
      .first();

    if (cached && cached.wordsWithHints.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * cached.wordsWithHints.length,
      );
      const selectedWord = cached.wordsWithHints[randomIndex];
      const remainingWords = cached.wordsWithHints.filter(
        (_, index) => index !== randomIndex,
      );

      // Remove the selected word from the cache
      if (remainingWords.length > 0) {
        await db.wordSets.update(cached.id, {
          wordsWithHints: remainingWords,
          usageCount: (cached.usageCount || 0) + 1,
        });
      } else {
        await db.wordSets.delete(cached.id);
      }

      return { wordWithHints: selectedWord, usedFallback: false };
    }
    const response = await fetch("/api/generate-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, language, count: 15, difficulty }),
    });

    if (response.ok) {
      const data = await response.json();
      const usedFallback = data.metadata?.source === "fallback";
      const randomIndex = Math.floor(
        Math.random() * data.wordsWithHints.length,
      );
      const selectedWord = data.wordsWithHints[randomIndex];
      const remainingWords: WordWithHints[] = data.wordsWithHints.filter(
        (_: WordWithHints, index: number) => index !== randomIndex,
      );
      if (remainingWords.length > 0 && !usedFallback) {
        await db.wordSets.add({
          id: `${category.toLowerCase()}-${language}-${Date.now()}`,
          category: category.toLowerCase(),
          wordsWithHints: remainingWords,
          language,
          createdAt: new Date(),
          usageCount: 1,
        });
      }

      return { wordWithHints: selectedWord, usedFallback };
    }
  } catch (error) {
    console.error("Error loading words:", error);
  }

  const langFallback =
    FALLBACK_WORDS_WITH_HINTS[language] ?? FALLBACK_WORDS_WITH_HINTS["en"];
  const categoryKey = category.toLowerCase() as keyof typeof langFallback;
  const categoryWords = langFallback[categoryKey];

  // Collect candidate words: prefer the matching category, otherwise pool all categories
  const candidates = categoryWords
    ? [...categoryWords]
    : Object.values(langFallback).flat();

  if (candidates.length === 0) {
    throw new Error(
      `No words available for category "${category}" in language "${language}"`,
    );
  }

  // Fisher-Yates shuffle for unbiased random selection
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return { wordWithHints: candidates[0], usedFallback: true };
}
