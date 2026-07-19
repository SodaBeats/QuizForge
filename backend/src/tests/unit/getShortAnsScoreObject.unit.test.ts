import { parseShortAnswerScores } from '../../services/getShortAnsScoreObject.service.js';
import type { ScoreableQuestion } from '../../services/getShortAnsScoreObject.service.js';

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

  it('accepts valid grading entries with scores and remarks', () => {
    const rawParsed = [
      {
        questionId: '11',
        score: 8,
        remarks: 'Good structure but add one more detail.',
      },
      {
        questionId: '12',
        score: 6,
        remarks: 'You are close; mention the core concept clearly.',
      },
    ];

    expect(parseShortAnswerScores(rawParsed, questions)).toEqual({
      scores: { '11': 8, '12': 6 },
      remarks: {
        '11': 'Good structure but add one more detail.',
        '12': 'You are close; mention the core concept clearly.',
      },
    });
  });

  it('rejects missing question IDs', () => {
    const rawParsed = [{ questionId: '11', score: 8, remarks: 'Good answer.' }];
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /invalid question IDs/i,
    );
  });

  it('rejects extra question IDs', () => {
    const rawParsed = [
      { questionId: '11', score: 8, remarks: 'Good answer.' },
      { questionId: '12', score: 6, remarks: 'Needs more detail.' },
      { questionId: '13', score: 7, remarks: 'Unexpected question.' },
    ];
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /invalid question IDs/i,
    );
  });

  it('rejects non-integer scores', () => {
    const rawParsed = [
      { questionId: '11', score: 9.5, remarks: 'Almost there.' },
      { questionId: '12', score: 7, remarks: 'Needs improvement.' },
    ];
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /unexpected format/i,
    );
  });

  it('rejects missing remarks', () => {
    const rawParsed = [
      { questionId: '11', score: 8 },
      { questionId: '12', score: 6, remarks: 'Needs improvement.' },
    ];
    expect(() => parseShortAnswerScores(rawParsed, questions)).toThrow(
      /unexpected format/i,
    );
  });
});
