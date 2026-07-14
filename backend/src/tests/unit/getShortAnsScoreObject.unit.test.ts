import { parseShortAnswerScores } from '../../services/getShortAnsScoreObject.service.js';
import type { ScoreableQuestion } from '../../services/getShortAnsScoreObject.service.js';

/*type ScoreableQuestion = {
  id: number;
  correctAnswer: string | null;
  questionType: string;
  questionText: string;
};*/

describe('parseShortAnswerScores', () => {
  const questions: ScoreableQuestion[] = [
    {
      id: 11,
      correctAnswer: 'foo',
      questionType: 'short-answer',
      questionText: 'Q1',
    },
    {
      id: 12,
      correctAnswer: 'bar',
      questionType: 'short-answer',
      questionText: 'Q2',
    },
  ];

  it('accepts valid scores for exact batch IDs', () => {
    const rawParsed = { '11': 8, '12': 6 };
    expect(parseShortAnswerScores(rawParsed, questions)).toEqual(rawParsed);
  });

  it('rejects missing question IDs', () => {
    const rawParsed = { '11': 8 };
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /invalid question IDs/i,
    );
  });

  it('rejects extra question IDs', () => {
    const rawParsed = { '11': 8, '12': 6, '13': 7 };
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /invalid question IDs/i,
    );
  });

  it('rejects non-integer scores', () => {
    const rawParsed = { '11': 9.5, '12': 7 };
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /unexpected format/i,
    );
  });

  it('rejects scores outside 0..10', () => {
    const rawParsed = { '11': 11, '12': 5 };
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /unexpected format/i,
    );
  });
});
