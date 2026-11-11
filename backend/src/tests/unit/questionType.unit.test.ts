// Tests for the reasoning-type set and its predicate:
//   reasoningQuestionTypes / isReasoningQuestionType (types/questionType.ts)
//
// quizSubmit's split and user-quiz's maxPoints both route through this
// predicate — these tests pin the set membership so adding/removing a type
// here changes grading deliberately.

import {
  reasoningQuestionTypes,
  isReasoningQuestionType,
} from '../../types/questionType.js';

describe('reasoningQuestionTypes', () => {
  it('contains exactly the four LLM-graded types', () => {
    expect(reasoningQuestionTypes).toEqual([
      'short-answer',
      'general-open-ended-objective',
      'code-explain-open-ended-objective',
      'code-output-predict-open-ended-objective',
    ]);
  });
});

describe('isReasoningQuestionType', () => {
  it.each([...reasoningQuestionTypes])('returns true for "%s"', (type) => {
    expect(isReasoningQuestionType(type)).toBe(true);
  });

  it('returns false for the exact-match (1 pt) types', () => {
    expect(isReasoningQuestionType('multiple-choice')).toBe(false);
    expect(isReasoningQuestionType('true-false')).toBe(false);
  });

  it('returns false for unknown or differently formatted strings', () => {
    // the DB column is a varchar — callers pass raw strings, and unexpected
    // values must fall through to the 1 pt path, not throw.
    expect(isReasoningQuestionType('multiple_choice')).toBe(false);
    expect(isReasoningQuestionType('SHORT-ANSWER')).toBe(false);
    expect(isReasoningQuestionType('')).toBe(false);
  });
});
