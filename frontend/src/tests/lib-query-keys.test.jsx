import { describe, it, expect } from "vitest";
import {
  attemptKeys,
  classKeys,
  docKeys,
  quizKeys,
} from "../lib/queryKeys.js";

const startsWith = (key, prefix) =>
  JSON.stringify(key.slice(0, prefix.length)) === JSON.stringify(prefix);

describe("lib/queryKeys — invalidation prefixes", () => {
  it("puts every quiz list variant under the shared lists prefix", () => {
    expect(startsWith(quizKeys.list(), quizKeys.lists)).toBe(true);
    expect(startsWith(quizKeys.list({ page: 2 }), quizKeys.lists)).toBe(true);
    // Unpaginated and paginated are distinct caches but share invalidation.
    expect(quizKeys.list()).not.toEqual(quizKeys.list({ page: 2 }));
  });

  it("puts questions/dashboard under quizKeys.all", () => {
    expect(startsWith(quizKeys.questions(7), quizKeys.all)).toBe(true);
    expect(startsWith(quizKeys.dashboard(7), quizKeys.all)).toBe(true);
  });

  it("keeps class list, document content, and attempt keys under their all prefixes", () => {
    expect(startsWith(classKeys.list, classKeys.all)).toBe(true);
    expect(startsWith(docKeys.content(3), docKeys.all)).toBe(true);
    expect(startsWith(docKeys.list(1), docKeys.all)).toBe(true);
    expect(startsWith(attemptKeys.quiz("TOKEN"), attemptKeys.all)).toBe(true);
  });
});
