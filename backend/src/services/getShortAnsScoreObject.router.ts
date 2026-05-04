import Groq from 'groq-sdk';
import { z } from 'zod';
import type { Question } from '../types/questionType.js';

type ScoreableQuestion = Pick<
  Question,
  'id' | 'correctAnswer' | 'questionType' | 'questionText'
>;

const groq = new Groq();

export const getShortAnsScoreObject = async (
  questions: ScoreableQuestion[],
  answers: Record<string, string> = {},
) => {
  if (!answers || questions.length === 0) {
    return 0;
  }

  try {
    const formatForLlm = questions.map((q) => {
      return {
        questionId: q.id,
        question: q.questionText,
        answer: answers[q.id],
      };
    });
    let rawParsed;

    const shortAnswerScoreSchema = z.record(z.string(), z.string());

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
                  # PERSONA
                    - You are a specialized Answer Grading Engine.
    
                  # GENERAL RULE
                    - Carefully read and judge if the answer correctly addresses the question.
                    - You will score the answer from 1 to 10. 1 being the lowest score, and 10 being the highest.
                  
                  # JSON OBJECT RULE
                    - The key will be the question id, and the value will be the score of the answer.
    
                  # SAMPLE OUTPUT
                    {
                      12: 9,
                      13: 7,
                      14: 9
                    }
                `,
        },
        {
          role: 'user',
          content: JSON.stringify(formatForLlm, null, 2),
        },
      ],
    });

    if (!response || !response.choices[0]?.message.content) {
      throw new Error('Failed to get response from Groq API');
    }
    try {
      rawParsed = JSON.parse(response.choices[0].message.content);
    } catch (err: any) {
      console.error(err);
      throw new Error(`Failed to parse LLM response: ${err.message}`);
    }
    const parsedScore = shortAnswerScoreSchema.safeParse(rawParsed);
    if (!parsedScore.success || !parsedScore.data) {
      throw new Error('LLM returned an unexpected format');
    }

    /*const rawScore = Object.values(parsedScore).reduce((sum, val) => {
            const numericVal = typeof val === 'number' ? val : 0;
            return sum + numericVal;
          }, 0);*/

    return parsedScore.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to grade answers: ${error.message}`);
  }
};
